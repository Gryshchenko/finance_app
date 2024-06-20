import { IAccountDataAccess } from 'interfaces/IAccountDataAccess';
import { IDatabaseConnection, ITransaction } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IAccount } from 'interfaces/IAccount';
import { ICreateAccount } from 'interfaces/ICreateAccount';

export default class AccountDataAccess extends LoggerBase implements IAccountDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    async createAccounts(userId: number, accounts: ICreateAccount[], trx?: ITransaction): Promise<IAccount[]> {
        try {
            this._logger.info('createAccounts request');
            const query = trx || this._db.engine();
            const data = await query('accounts').insert(
                accounts.map(({ accountName, currencyId, amount }) => ({ userId, accountName, currencyId, amount })),
                ['accountId', 'userId', 'accountName', 'currencyId', 'amount'],
            );
            this._logger.info('createAccounts response');
            return data;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
    async getAccounts(userId: number): Promise<IAccount[] | undefined> {
        try {
            this._logger.info('getAccounts request');

            const data = await this.getAccountBaseQuery()
                .innerJoin('currencies', 'accounts.currencyId', 'currencies.currencyId')
                .where({ userId });
            this._logger.info('getAccounts response');
            return data;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
    async getAccount(userId: number, accountId: number): Promise<IAccount | undefined> {
        try {
            this._logger.info('getAccount request');
            const data = await this.getAccountBaseQuery().where({ userId, accountId }).first();
            this._logger.info('getAccount response');
            return data;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
    protected getAccountBaseQuery() {
        return this._db
            .engine()('accounts')
            .select(
                'accounts.accountId',
                'accounts.userId',
                'accounts.amount',
                'accounts.accountName',
                'accounts.currencyId',
                'currencies.currencyCode',
                'currencies.currencyName',
                'currencies.symbol',
            );
    }
}
