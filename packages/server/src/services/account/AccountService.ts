import { IAccount, Utils, IAccountListItem, ErrorCode } from 'tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { ICreateAccount } from 'interfaces/ICreateAccount';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IAccountDataAccess } from 'services/account/AccountDataAccess';
import { NotFoundError } from 'src/utils/errors/NotFoundError';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { validateAllowedProperties } from 'src/utils/validation/validateAllowedProperties';

export interface IAccountService {
    createAccount(userId: number, account: ICreateAccount, trx?: IDBTransaction): Promise<IAccount>;
    createAccounts(userId: number, accounts: ICreateAccount[], trx?: IDBTransaction): Promise<IAccount[]>;
    getAccounts(userId: number): Promise<IAccountListItem[] | undefined>;
    getAccount(userId: number, accountId: number): Promise<IAccount | undefined>;
    deleteAccount(userId: number, accountId: number, trx?: IDBTransaction): Promise<boolean>;
    patchAccount(userId: number, accountId: number, properties: Partial<IAccount>, trx?: IDBTransaction): Promise<number>;
    addAmount(userId: number, accountId: number, amount: number, trx?: IDBTransaction): Promise<number>;
}

export default class AccountService extends LoggerBase implements IAccountService {
    private readonly _accountDataAccess: IAccountDataAccess;

    public constructor(accountDataAccess: IAccountDataAccess) {
        super();
        this._accountDataAccess = accountDataAccess;
    }

    async createAccount(userId: number, account: ICreateAccount, trx?: IDBTransaction): Promise<IAccount> {
        validateAllowedProperties(account as unknown as Record<string, string | number>, [
            'accountName',
            'amount',
            'currencyCode',
            'iconId',
        ]);
        const accounts = await this._accountDataAccess.createAccounts(userId, [account], trx);
        if (Utils.isArrayNotEmpty(accounts)) {
            return accounts[0];
        }
        throw new NotFoundError({ message: 'Account not created, result empty', errorCode: ErrorCode.ACCOUNT_ERROR });
    }
    async createAccounts(userId: number, accounts: ICreateAccount[], trx?: IDBTransaction): Promise<IAccount[]> {
        return await this._accountDataAccess.createAccounts(userId, accounts, trx);
    }
    async patchAccount(userId: number, accountId: number, properties: Partial<IAccount>, trx?: IDBTransaction): Promise<number> {
        return await this._accountDataAccess.patchAccount(userId, accountId, properties, trx);
    }
    async addAmount(userId: number, accountId: number, amount: number, trx?: IDBTransaction): Promise<number> {
        return await this._accountDataAccess.addAmount(userId, accountId, amount, trx);
    }
    async getAccount(userId: number, accountId: number): Promise<IAccount | undefined> {
        try {
            if (Utils.isNull(accountId)) {
                throw new ValidationError({ message: 'accountId cant be null' });
            }
            if (Utils.isNull(userId)) {
                throw new ValidationError({ message: 'userId cant be null' });
            }
            const account = await this._accountDataAccess.getAccount(userId, accountId);
            return {
                ...account,
                amount: Utils.roundNumber(account?.amount),
            };
        } catch (e: unknown) {
            this._logger.error(`Fetch account failed due reason: ${(e as { message: string }).message}`);
            throw e;
        }
    }
    async getAccounts(userId: number): Promise<IAccountListItem[] | undefined> {
        return await this._accountDataAccess.getAccounts(userId);
    }
    async deleteAccount(userId: number, accountId: number, trx?: IDBTransaction): Promise<boolean> {
        return await this._accountDataAccess.deleteAccount(userId, accountId, trx);
    }
}
