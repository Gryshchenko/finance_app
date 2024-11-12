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
            this._logger.info(`Starting account creation for userId: ${userId}`);

            const query = trx || this._db.engine();
            const data = await query('accounts').insert(
                accounts.map(({ accountName, currencyId, amount }) => ({
                    userId,
                    accountName,
                    currencyId,
                    amount,
                })),
                ['accountId', 'userId', 'accountName', 'currencyId', 'amount'],
            );

            this._logger.info(`Successfully created ${data.length} accounts for userId: ${userId}`);
            return data;

        } catch (error: any) {
            this._logger.error(`Failed to create accounts for userId: ${userId}. Error: ${error.message}`);
            throw new Error(`Account creation failed due to a database error: ${error.message}`);
        }
    }

    async getAccounts(userId: number): Promise<IAccount[] | undefined> {
        try {
            this._logger.info(`Fetching all accounts for userId: ${userId}`);

            const data = await this.getAccountBaseQuery()
                .innerJoin('currencies', 'accounts.currencyId', 'currencies.currencyId')
                .where({ userId });

            if (!data.length) {
                this._logger.warn(`No accounts found for userId: ${userId}`);
            } else {
                this._logger.info(`Fetched ${data.length} accounts for userId: ${userId}`);
            }

            return data;

        } catch (error: any) {
            this._logger.error(`Failed to fetch accounts for userId: ${userId}. Error: ${error?.message}`);
            throw new Error(`Fetching accounts failed due to a database error: ${error.message}`);
        }
    }

    async getAccount(userId: number, accountId: number): Promise<IAccount | undefined> {
        try {
            this._logger.info(`Fetching account with accountId: ${accountId} for userId: ${userId}`);

            const data = await this.getAccountBaseQuery().where({ userId, accountId }).first();

            if (!data) {
                this._logger.warn(`Account with accountId: ${accountId} not found for userId: ${userId}`);
            } else {
                this._logger.info(`Fetched account with accountId: ${accountId} for userId: ${userId}`);
            }

            return data;

        } catch (error: any) {
            this._logger.error(`Failed to fetch account with accountId: ${accountId} for userId: ${userId}. Error: ${error.message}`);
            throw new Error(`Fetching account failed due to a database error: ${error.message}`);
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
