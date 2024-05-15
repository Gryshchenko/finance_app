import { ICategoryDataAccess } from 'interfaces/ICategoryDataAccess';
import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { ICreateCategory } from 'interfaces/ICreateCategory';
import { ICategory } from 'interfaces/ICategory';

export default class CategoryDataService extends LoggerBase implements ICategoryDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    public async createCategories(userId: number, categories: ICreateCategory[]): Promise<ICategory[]> {
        try {
            this._logger.info('createCategories request');
            const data = await this._db
                .engine()('categories')
                .insert(
                    [categories.map(({ categoryName, currencyId }) => ({ userId, categoryName, currencyId }))],
                    ['categoryId', 'userId', 'categoryName', 'currencyId'],
                );
            this._logger.info('createCategories response');
            return data;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
}
