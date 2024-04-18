import { IIncomeDataAccess } from 'interfaces/IIncomeDataAccess';
import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IIncome } from 'interfaces/IIncome';
import { ICreateIncome } from 'interfaces/ICreateIncome';

export default class IncomeDataService extends LoggerBase implements IIncomeDataAccess {
    private readonly _db: IDatabaseConnection;
    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }
    public async createIncomes(userId: number, incomes: ICreateIncome[]): Promise<IIncome[]> {
        try {
            this._logger.info('createIncome request');
            const data = await this._db
                .engine()('incomes')
                .insert(
                    [incomes.map(({ incomeName, currencyId }) => ({ userId, incomeName, currencyId }))],
                    ['incomeId', 'userId', 'incomeName', 'currencyId'],
                );
            this._logger.info('createIncome response');
            return data;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
}
