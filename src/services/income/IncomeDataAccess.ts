import { IIncomeDataAccess } from 'interfaces/IIncomeDataAccess';
import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IIncome } from 'interfaces/IIncome';

module.exports = class IncomeDataService extends LoggerBase implements IIncomeDataAccess {
    private readonly _db: IDatabaseConnection;
    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }
    public async createIncome(userId: number, incomeNames: string[], currencyId: number): Promise<IIncome[]> {
        try {
            this._logger.info('createIncome request');
            const data = await this._db
                .engine()('incomes')
                .insert(
                    [incomeNames.map((incomeName) => ({ userId, incomeName, currencyId }))],
                    ['incomeId', 'userId', 'incomeName', 'currencyId'],
                );
            this._logger.info('createIncome response');
            return data;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
};
