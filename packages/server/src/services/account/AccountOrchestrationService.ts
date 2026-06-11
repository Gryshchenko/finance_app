import { ErrorCode, HttpCode, IAccount, Utils } from 'tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { ICreateAccount } from 'interfaces/ICreateAccount';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IAccountService } from 'services/account/AccountService';
import { IBalanceService } from 'services/balance/BalanceService';
import { ICurrencyService } from 'services/currency/CurrencyService';
import { ITransactionService } from 'services/transaction/TransactionService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import { UnitOfWork } from 'src/repositories/UnitOfWork';
import { CustomError } from 'src/utils/errors/CustomError';
import { ValidationError } from 'src/utils/errors/ValidationError';

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
            return await this._accountService.createAccount(userId, account, trx);
        });
    }
    public async patch(userId: number, accountId: number, properties: Partial<IAccount>): Promise<number> {
        return await this.withTransaction(async (trx: IDBTransaction) => {
            return await this._accountService.patchAccount(userId, accountId, properties, trx);
        });
    }
    public async delete(userId: number, accountId: number): Promise<boolean> {
        return this.withTransaction(async (trx: IDBTransaction) => {
            try {
                await this._transactionService.deleteTransactionsForAccount(userId, accountId, trx as unknown as IDBTransaction);
                return await this._accountService.deleteAccount(userId, accountId, trx as unknown as IDBTransaction);
            } catch (e: unknown) {
                this._logger.error(`Delete account failed due reason: ${(e as { message: string }).message}`);
                throw e;
            }
        });
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
