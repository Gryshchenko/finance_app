import { IIncomeDataAccess } from 'interfaces/IIncomeDataAccess';
import { IDatabaseConnection, ITransaction } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IIncome } from 'interfaces/IIncome';
import { ICreateIncome } from 'interfaces/ICreateIncome';

export default class IncomeDataAccess extends LoggerBase implements IIncomeDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    public async createIncomes(userId: number, incomes: ICreateIncome[], trx?: ITransaction): Promise<IIncome[]> {
        try {
            this._logger.info('createIncome request');
            const query = trx || this._db.engine();
            const data = await query('incomes').insert(
                incomes.map(({ incomeName, currencyId }) => ({ userId, incomeName, currencyId })),
                ['incomeId', 'userId', 'incomeName', 'currencyId'],
            );
            this._logger.info('createIncome response');
            return data;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
    async getIncomes(userId: number): Promise<IIncome[] | undefined> {
        try {
            this._logger.info('getCategories request');

            const data = await this.getIncomeBaseQuery()
                .innerJoin('incomes', 'incomes.currencyId', 'currencies.currencyId')
                .where({ userId });
            this._logger.info('getCategories response');
            return data;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
    async getIncome(userId: number, categoryId: number): Promise<IIncome | undefined> {
        try {
            this._logger.info('getIncome request');
            const data = await this.getIncomeBaseQuery().where({ userId, categoryId }).first();
            this._logger.info('getIncome response');
            return data;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
    protected getIncomeBaseQuery() {
        return this._db
            .engine()('incomes')
            .select(
                'incomes.accountId',
                'incomes.userId',
                'incomes.amount',
                'incomes.incomeName',
                'incomes.currencyId',
                'currencies.currencyCode',
                'currencies.currencyName',
                'currencies.symbol',
            );
    }
}
