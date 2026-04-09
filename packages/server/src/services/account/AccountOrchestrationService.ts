import { ICurrencyService } from 'services/currency/CurrencyService';
import { IBalanceService } from 'services/balance/BalanceService';
import { LoggerBase } from 'helper/logger/LoggerBase';
import { Utils } from 'tenpercent/shared';
import { DBError } from 'src/utils/errors/DBError';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { ICreateAccount } from 'interfaces/ICreateAccount';
import { IAccount } from 'tenpercent/shared';
import { CustomError } from 'src/utils/errors/CustomError';
import { ErrorCode } from 'tenpercent/shared';
import { HttpCode } from 'tenpercent/shared';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import { UnitOfWork } from 'src/repositories/UnitOfWork';
import { IAccountService } from 'services/account/AccountService';
import { ITransactionService } from 'services/transaction/TransactionService';

export class AccountOrchestrationService extends LoggerBase {
    private readonly _accountService: IAccountService;
    private readonly _currencyService: ICurrencyService;
    private readonly _balanceService: IBalanceService;
    private readonly _transactionService: ITransactionService;
    constructor({
        accountService,
        balanceService,
        currencyService,
        transactionService,
    }: {
        accountService: IAccountService;
        currencyService: ICurrencyService;
        balanceService: IBalanceService;
        transactionService: ITransactionService;
    }) {
        super();
        this._accountService = accountService;
        this._currencyService = currencyService;
        this._balanceService = balanceService;
        this._transactionService = transactionService;
    }

    public async create(userId: number, account: ICreateAccount): Promise<IAccount> {
        return await this.withTransaction(async (trx: IDBTransaction) => {
            const { amount, currencyId } = account;
            const currency = await this._currencyService.getById(currencyId);
            if (Utils.isNull(currency) || Utils.isNull(currency?.currencyCode)) {
                throw new ValidationError({
                    message: `Accounts creation failed due cant find currencyCode for currencyID: ${account.currencyId}`,
                });
            }
            if (Utils.isNull(amount)) {
                throw new ValidationError({
                    message: `Accounts creation failed due balance update amount should not be null amount: ${amount}`,
                });
            }
            const newAccount = await this._accountService.createAccount(userId, account, trx);
            await this._balanceService.patch(
                userId,
                {
                    currencyCode: currency?.currencyCode as string,
                    amount,
                },
                trx,
            );
            return newAccount;
        });
    }
    public async patch(userId: number, accountId: number, properties: Partial<IAccount>): Promise<number> {
        return await this.withTransaction(async (trx: IDBTransaction) => {
            const result = await this._accountService.patchAccount(userId, accountId, properties, trx);
            if (Utils.isNotNull(properties.amount)) {
                const amount = properties.amount as unknown as number;
                const account = await this._accountService.getAccount(userId, accountId);
                if (Utils.isNotNull(account) && Utils.isNotNull(account?.currencyCode)) {
                    await this.updateBalance(userId, account?.currencyCode as string, amount, trx);
                } else {
                    throw new ValidationError({
                        message: `Accounts patch failed due reason find currencyCode for accountId: ${accountId}`,
                    });
                }
            }
            return result;
        });
    }
    public async delete(userId: number, accountId: number): Promise<boolean> {
        return this.withTransaction(async (trx: IDBTransaction) => {
            try {
                const account = await this._accountService.getAccount(userId, accountId);
                await this._transactionService.deleteTransactionsForAccount(userId, accountId, trx as unknown as IDBTransaction);
                const result = await this._accountService.deleteAccount(userId, accountId, trx as unknown as IDBTransaction);
                if (Utils.isNotNull(account) && Utils.isNotNull(account?.currencyCode) && !isNaN(account?.amount as number)) {
                    await this.updateBalance(
                        userId,
                        account?.currencyCode as string,
                        (account?.amount as number) * -1,
                        trx as unknown as IDBTransaction,
                    );
                } else {
                    throw new ValidationError({
                        message: `Accounts patch failed due reason find currencyCode for accountId: ${accountId}`,
                    });
                }
                return result;
            } catch (e: unknown) {
                this._logger.error(`Delete account failed due reason: ${(e as { message: string }).message}`);
                throw e;
            }
        });
    }

    private async updateBalance(userId: number, currencyCode: string, amount: number, trx?: IDBTransaction): Promise<void> {
        if (Utils.isNull(currencyCode)) {
            throw new DBError({ message: `Cant update balance for userId: ${userId} miss currency code` });
        }
        if (Utils.greaterThen0(amount)) {
            await this._balanceService.patch(userId, { amount, currencyCode: currencyCode }, trx);
        }
    }

    private async withTransaction<T>(processor: (trx: IDBTransaction) => Promise<T>): Promise<T> {
        const db: IDatabaseConnection = DatabaseConnectionBuilder.build();
        const uow = new UnitOfWork(db);
        try {
            await uow.start();
            const trx = uow.getTransaction();
            if (Utils.isNull(trx)) {
                throw new CustomError({
                    message: 'Transaction not initiated. User could not be created',
                    errorCode: ErrorCode.ACCOUNT_ERROR,
                    statusCode: HttpCode.INTERNAL_SERVER_ERROR,
                });
            }

            const response = await processor(trx as unknown as IDBTransaction);
            await uow.commit();
            return response;
        } catch (e: unknown) {
            await uow.rollback();
            throw e;
        }
    }
}
