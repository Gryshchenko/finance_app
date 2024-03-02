import { IAccountDataAccess } from 'interfaces/IAccountDataAccess';
import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IAccount } from 'interfaces/IAccount';
import { ICreateAccount } from 'interfaces/ICreateAccount';

module.exports = class AccountDataService extends LoggerBase implements IAccountDataAccess {
    private readonly _db: IDatabaseConnection;
    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }
    async createAccounts(userId: number, accounts: ICreateAccount[]): Promise<IAccount[]> {
        try {
            this._logger.info('createAccounts request');
            const data = await this._db
                .engine()('accounts')
                .insert(
                    [accounts.map(({ accountName, currencyId, amount }) => ({ userId, accountName, currencyId, amount }))],
                    ['accountId', 'userId', 'accountName', 'currencyId', 'amount'],
                );
            this._logger.info('createAccounts response');
            return data;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
};
