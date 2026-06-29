import { closeTestApp, createUser, generateSecureRandom } from '../TestsUtils.';
import DatabaseConnection from '../../src/repositories/DatabaseConnection';
import config from '../../src/config/dbConfig';
import { HttpCode, StatsPeriod, Time, Utils } from 'tenpercent/shared';
import {
    createExpenseTransaction,
    createIncomeTransaction,
    createTransferTransaction,
    deleteTransaction,
    getTransaction,
    patchTransaction,
} from './TransactionsTestUtils';
import { getSummary } from '../stats/StatsTestUtils';
import { createAccount } from '../account/AccountTestUtils';
import { createCategory } from '../category/CategoryTestUtils';
import { createIncome } from '../income/IncomeTestUtils';
import { getBalance } from '../balance/BalanceTestUtils';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const app = require('../../src/app');

let server: never;
let userIds: number[] = [];

const EUR_USD = 1.161346;
const GBP_USD = 1.361452;

const DEC_FROM = '2025-12-01T00:00:00.000Z';
const DEC_TO = '2025-12-31T00:00:00.000Z';
const DATE = Time.jsDateToUTCISO(new Date('2025-12-15T11:00:00'));

// shared date/range for the operation tests below (each test uses its own isolated user)
const TX_DATE = Time.jsDateToUTCISO(new Date('2026-03-15T11:00:00'));
const RANGE = { from: '2026-03-01T00:00:00.000Z', to: '2026-03-31T00:00:00.000Z', period: StatsPeriod.Month };

// Creates a user (base USD) with one account (amount 0), income and category per currency.
async function setupUser() {
    const agent = request.agent(server);
    const databaseConnection = DatabaseConnection.instance(config);
    const { userId, authorization } = await createUser({ agent, databaseConnection });
    userIds.push(userId);

    const accountIds: Record<string, number> = {};
    const incomeIds: Record<string, number> = {};
    const categoryIds: Record<string, number> = {};
    for (const currency of ['USD', 'EUR', 'GBP'] as const) {
        accountIds[currency] = await createAccount(agent, userId, authorization, currency, 0, `Account ${currency}`);
        incomeIds[currency] = await createIncome(agent, userId, authorization, currency, `Income ${currency}`);
        categoryIds[currency] = await createCategory(agent, userId, authorization, currency, `Category ${currency}`);
    }
    return { agent, userId, authorization, accountIds, incomeIds, categoryIds };
}

beforeAll(() => {
    const port = Math.floor(generateSecureRandom() * (65535 - 1024) + 1024);
    // @ts-expect-error is necessary
    server = app.listen(port);
});

afterAll(async () => {
    await closeTestApp(server, userIds);
});

describe('Multi-currency user with same-currency transactions', () => {
    it('aggregates balance and summary into the base currency (USD) across USD/EUR/GBP', async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        // signup default currency is USD => the user base currency is USD
        const { userId, authorization } = await createUser({ agent, databaseConnection });
        userIds.push(userId);

        const summaryDec = () =>
            getSummary(agent, userId, authorization, { from: DEC_FROM, to: DEC_TO, period: StatsPeriod.Month });

        const currencies = ['USD', 'EUR', 'GBP'] as const;

        const accountIds: Record<string, number> = {};
        const incomeIds: Record<string, number> = {};
        const categoryIds: Record<string, number> = {};
        for (const currency of currencies) {
            accountIds[currency] = await createAccount(agent, userId, authorization, currency, 0, `Account ${currency}`);
            incomeIds[currency] = await createIncome(agent, userId, authorization, currency, `Income ${currency}`);
            categoryIds[currency] = await createCategory(agent, userId, authorization, currency, `Category ${currency}`);
        }

        const INCOME = 100;
        const balanceBefore = await getBalance(agent, userId, authorization);
        for (const currency of currencies) {
            await createIncomeTransaction(
                agent,
                userId,
                authorization,
                accountIds[currency],
                incomeIds[currency],
                currency,
                INCOME,
                DATE,
            );
        }
        const balanceAfterIncome = await getBalance(agent, userId, authorization);

        // 100 USD + 100 EUR + 100 GBP, each converted to USD
        const expectedIncomeBase = INCOME + INCOME * EUR_USD + INCOME * GBP_USD;

        // check balance: it grew by the converted income
        expect(Utils.roundNumber(balanceAfterIncome - balanceBefore)).toEqual(Utils.roundNumber(expectedIncomeBase));
        // conversion really happened (foreign currencies are worth more USD than the raw 3 x 100)
        expect(expectedIncomeBase).toBeGreaterThan(INCOME * currencies.length);

        // check income: summary income_total is the same converted sum, in base currency
        const afterIncome = await summaryDec();
        expect(Utils.roundNumber(afterIncome.income_total)).toEqual(Utils.roundNumber(expectedIncomeBase));
        expect(Utils.roundNumber(afterIncome.expense_total)).toEqual(0);
        // summary agrees with the balance delta (both convert via the same rates)
        expect(Utils.roundNumber(afterIncome.income_total)).toEqual(Utils.roundNumber(balanceAfterIncome - balanceBefore));

        // ---- three expense transactions: account(currency) -> category(currency), 50 each ----
        const EXPENSE = 50;
        for (const currency of currencies) {
            await createExpenseTransaction(
                agent,
                userId,
                authorization,
                accountIds[currency],
                categoryIds[currency],
                currency,
                EXPENSE,
                DATE,
            );
        }
        const balanceAfterExpense = await getBalance(agent, userId, authorization);

        const expectedExpenseBase = EXPENSE + EXPENSE * EUR_USD + EXPENSE * GBP_USD;

        // check balance: it dropped by the converted expense
        expect(Utils.roundNumber(balanceAfterIncome - balanceAfterExpense)).toEqual(Utils.roundNumber(expectedExpenseBase));

        // check expense: summary expense_total is the converted sum, income_total unchanged
        const afterExpense = await summaryDec();
        expect(Utils.roundNumber(afterExpense.expense_total)).toEqual(Utils.roundNumber(expectedExpenseBase));
        expect(Utils.roundNumber(afterExpense.income_total)).toEqual(Utils.roundNumber(expectedIncomeBase));
        expect(Utils.roundNumber(afterExpense.expense_total)).toEqual(
            Utils.roundNumber(balanceAfterIncome - balanceAfterExpense),
        );
    });

    it('moving a transaction across months keeps the balance but shifts income/expense by range', async () => {
        const agent = request.agent(server);
        const databaseConnection = DatabaseConnection.instance(config);
        const { userId, authorization } = await createUser({ agent, databaseConnection });
        userIds.push(userId);

        const FEB_DATE = Time.jsDateToUTCISO(new Date('2026-02-15T11:00:00'));
        const JAN_DATE = Time.jsDateToUTCISO(new Date('2026-01-15T11:00:00'));
        const febRange = { from: '2026-02-01T00:00:00.000Z', to: '2026-02-28T00:00:00.000Z', period: StatsPeriod.Month };
        const janRange = { from: '2026-01-01T00:00:00.000Z', to: '2026-01-31T00:00:00.000Z', period: StatsPeriod.Month };

        const currencies = ['USD', 'EUR', 'GBP'] as const;
        const accountIds: Record<string, number> = {};
        const incomeIds: Record<string, number> = {};
        const categoryIds: Record<string, number> = {};
        for (const currency of currencies) {
            accountIds[currency] = await createAccount(agent, userId, authorization, currency, 0, `Account ${currency}`);
            incomeIds[currency] = await createIncome(agent, userId, authorization, currency, `Income ${currency}`);
            categoryIds[currency] = await createCategory(agent, userId, authorization, currency, `Category ${currency}`);
        }

        const INCOME = 100;
        const EXPENSE = 50;

        // every transaction lands in February
        const incomeTxnIds: Record<string, number> = {};
        for (const currency of currencies) {
            incomeTxnIds[currency] = await createIncomeTransaction(
                agent,
                userId,
                authorization,
                accountIds[currency],
                incomeIds[currency],
                currency,
                INCOME,
                FEB_DATE,
            );
        }
        for (const currency of currencies) {
            await createExpenseTransaction(
                agent,
                userId,
                authorization,
                accountIds[currency],
                categoryIds[currency],
                currency,
                EXPENSE,
                FEB_DATE,
            );
        }

        const balanceBeforeMove = await getBalance(agent, userId, authorization);
        const expectedIncomeBase = INCOME + INCOME * EUR_USD + INCOME * GBP_USD;
        const expectedExpenseBase = EXPENSE + EXPENSE * EUR_USD + EXPENSE * GBP_USD;

        // February holds everything; January is empty
        const febBefore = await getSummary(agent, userId, authorization, febRange);
        expect(Utils.roundNumber(febBefore.income_total)).toEqual(Utils.roundNumber(expectedIncomeBase));
        expect(Utils.roundNumber(febBefore.expense_total)).toEqual(Utils.roundNumber(expectedExpenseBase));

        const janBefore = await getSummary(agent, userId, authorization, janRange);
        expect(Utils.roundNumber(janBefore.income_total)).toEqual(0);
        expect(Utils.roundNumber(janBefore.expense_total)).toEqual(0);

        // move the EUR income transaction from February to January (date only)
        await patchTransaction(agent, userId, authorization, incomeTxnIds.EUR, { createdAt: JAN_DATE });
        const movedIncomeBase = INCOME * EUR_USD; // 100 EUR converted to USD

        // balance is a point-in-time total: changing only the date must NOT change it
        const balanceAfterMove = await getBalance(agent, userId, authorization);
        expect(Utils.roundNumber(balanceAfterMove)).toEqual(Utils.roundNumber(balanceBeforeMove));

        // income shifts by range: February loses the moved income, January gains it; expense stays
        const febAfter = await getSummary(agent, userId, authorization, febRange);
        expect(Utils.roundNumber(febAfter.income_total)).toEqual(Utils.roundNumber(expectedIncomeBase - movedIncomeBase));
        expect(Utils.roundNumber(febAfter.expense_total)).toEqual(Utils.roundNumber(expectedExpenseBase));

        const janAfter = await getSummary(agent, userId, authorization, janRange);
        expect(Utils.roundNumber(janAfter.income_total)).toEqual(Utils.roundNumber(movedIncomeBase));
        expect(Utils.roundNumber(janAfter.expense_total)).toEqual(0);
    });

    it('DELETE: removing a transaction reverts balance and summary (per-currency)', async () => {
        const { agent, userId, authorization, accountIds, incomeIds } = await setupUser();

        const INCOME = 100;
        const incomeTxnIds: Record<string, number> = {};
        for (const currency of ['USD', 'EUR', 'GBP'] as const) {
            incomeTxnIds[currency] = await createIncomeTransaction(
                agent,
                userId,
                authorization,
                accountIds[currency],
                incomeIds[currency],
                currency,
                INCOME,
                TX_DATE,
            );
        }

        const balanceAfterIncome = await getBalance(agent, userId, authorization);
        const summaryAfterIncome = await getSummary(agent, userId, authorization, RANGE);
        const expectedIncomeBase = INCOME + INCOME * EUR_USD + INCOME * GBP_USD;
        expect(Utils.roundNumber(summaryAfterIncome.income_total)).toEqual(Utils.roundNumber(expectedIncomeBase));

        // delete the EUR income
        await deleteTransaction(agent, userId, authorization, { transactionId: incomeTxnIds.EUR });
        const removedBase = INCOME * EUR_USD;

        const balanceAfterDelete = await getBalance(agent, userId, authorization);
        const summaryAfterDelete = await getSummary(agent, userId, authorization, RANGE);

        // both balance and summary drop by exactly the EUR income (converted)
        expect(Utils.roundNumber(balanceAfterIncome - balanceAfterDelete)).toEqual(Utils.roundNumber(removedBase));
        expect(Utils.roundNumber(summaryAfterDelete.income_total)).toEqual(Utils.roundNumber(expectedIncomeBase - removedBase));
    });

    it('PATCH amount: balance and summary update by the converted delta', async () => {
        const { agent, userId, authorization, accountIds, incomeIds } = await setupUser();

        const eurIncomeTxn = await createIncomeTransaction(
            agent,
            userId,
            authorization,
            accountIds.EUR,
            incomeIds.EUR,
            'EUR',
            100,
            TX_DATE,
        );

        const balanceBefore = await getBalance(agent, userId, authorization);
        const summaryBefore = await getSummary(agent, userId, authorization, RANGE);
        expect(Utils.roundNumber(summaryBefore.income_total)).toEqual(Utils.roundNumber(100 * EUR_USD));

        // 100 EUR -> 250 EUR (+150 EUR)
        await patchTransaction(agent, userId, authorization, eurIncomeTxn, { amount: 250, targetAmount: 250 });
        const deltaBase = 150 * EUR_USD;

        const balanceAfter = await getBalance(agent, userId, authorization);
        const summaryAfter = await getSummary(agent, userId, authorization, RANGE);

        expect(Utils.roundNumber(balanceAfter - balanceBefore)).toEqual(Utils.roundNumber(deltaBase));
        expect(Utils.roundNumber(summaryAfter.income_total)).toEqual(Utils.roundNumber(250 * EUR_USD));
    });

    it('PATCH account to a different currency: the transaction currency follows the account', async () => {
        const { agent, userId, authorization, accountIds, incomeIds } = await setupUser();

        // EUR income into the EUR account
        const txn = await createIncomeTransaction(
            agent,
            userId,
            authorization,
            accountIds.EUR,
            incomeIds.EUR,
            'EUR',
            100,
            TX_DATE,
        );

        const summaryBefore = await getSummary(agent, userId, authorization, RANGE);
        // counted as 100 EUR -> converted to base
        expect(Utils.roundNumber(summaryBefore.income_total)).toEqual(Utils.roundNumber(100 * EUR_USD));

        // move the transaction to the USD account
        await patchTransaction(agent, userId, authorization, txn, { accountId: accountIds.USD });

        // it now lives in a USD account, so it must be a USD income
        const moved = await getTransaction(agent, userId, authorization, { transactionId: txn });
        expect(moved.currencyCode).toEqual('USD');

        // and the summary must count it as 100 USD (not 100 EUR converted)
        const summaryAfter = await getSummary(agent, userId, authorization, RANGE);
        expect(Utils.roundNumber(summaryAfter.income_total)).toEqual(100);
    });

    it('TRANSFER (same currency): total balance unchanged, transfer_total recorded (converted)', async () => {
        const { agent, userId, authorization } = await setupUser();

        // two EUR accounts: source funded, target empty
        const eurSource = await createAccount(agent, userId, authorization, 'EUR', 1000, 'EUR source');
        const eurTarget = await createAccount(agent, userId, authorization, 'EUR', 0, 'EUR target');

        const balanceBefore = await getBalance(agent, userId, authorization);

        await createTransferTransaction(agent, userId, authorization, eurSource, eurTarget, 'EUR', 100, TX_DATE);

        const balanceAfter = await getBalance(agent, userId, authorization);
        // moving money between two accounts of the same currency leaves the total unchanged
        expect(Utils.roundNumber(balanceAfter)).toEqual(Utils.roundNumber(balanceBefore));

        // the transfer is recorded and converted to the base currency
        const summary = await getSummary(agent, userId, authorization, RANGE);
        expect(Utils.roundNumber(summary.transfer_total)).toEqual(Utils.roundNumber(100 * EUR_USD));
    });
});
