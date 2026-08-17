import { ErrorCode, HttpCode, IAccount, Utils } from '@tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { ICreateAccount } from 'interfaces/ICreateAccount';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IAccountService } from 'services/account/AccountService';
import { ICurrencyService } from 'services/currency/CurrencyService';
import { GroupOrchestrationService } from 'services/groupOrchestrator/GroupOrchestrationService';
import { ITransactionService } from 'services/transaction/TransactionService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import { UnitOfWork } from 'src/repositories/UnitOfWork';
import { CustomError } from 'src/utils/errors/CustomError';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { AccountType } from 'types/AccountType';

export class AccountOrchestrationService extends LoggerBase {
    private readonly _accountService: IAccountService;
    private readonly _currencyService: ICurrencyService;
    private readonly _transactionService: ITransactionService;
    private readonly _groupOrchestrationService: GroupOrchestrationService;
    constructor({
        accountService,
        currencyService,
        transactionService,
        groupOrchestrationService,
    }: {
        accountService: IAccountService;
        currencyService: ICurrencyService;
        transactionService: ITransactionService;
        groupOrchestrationService: GroupOrchestrationService;
    }) {
        super();
        this._accountService = accountService;
        this._currencyService = currencyService;
        this._transactionService = transactionService;
        this._groupOrchestrationService = groupOrchestrationService;
    }

    public async create(userId: number, account: ICreateAccount): Promise<IAccount> {
        return await this.withTransaction(async (trx: IDBTransaction) => {
            const { amount, currencyCode } = account;
            const currency = await this._currencyService.getByCurrencyCode(currencyCode);
            if (Utils.isNull(currency) || Utils.isNull(currency?.currencyCode)) {
                throw new ValidationError({
                    message: `Accounts creation failed due cant find currencyCode for currencyID: ${account.currencyCode}`,
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
    public async delete(userId: number, accountId: number, keepData: boolean): Promise<boolean> {
        return this.withTransaction(async (trx: IDBTransaction) => {
            try {
                const sharedItemId = await this._groupOrchestrationService.getSharedEntity(userId, 'accounts', accountId, trx);
                if (Utils.isNotNull(sharedItemId)) {
                    throw new ValidationError({
                        message: `Delete account failed due reason: account ${accountId} is shared with sharedItemId: ${sharedItemId}`,
                        errorCode: ErrorCode.ACCOUNT_DELETE_GROUP_ERROR,
                        statusCode: HttpCode.BAD_REQUEST,
                    });
                }
                if (!keepData) {
                    await this._transactionService.deleteTransactionsForEntity(
                        userId,
                        AccountType.Account,
                        accountId,
                        trx as unknown as IDBTransaction,
                    );
                }
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
