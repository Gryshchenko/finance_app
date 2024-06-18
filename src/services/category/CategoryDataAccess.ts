import { ICategoryDataAccess } from 'interfaces/ICategoryDataAccess';
import { IDatabaseConnection, ITransaction } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { ICreateCategory } from 'interfaces/ICreateCategory';
import { ICategory } from 'interfaces/ICategory';

export default class CategoryDataAccess extends LoggerBase implements ICategoryDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    public async createCategories(userId: number, categories: ICreateCategory[], trx?: ITransaction): Promise<ICategory[]> {
        try {
            this._logger.info('createCategories request');
            const query = trx || this._db.engine();
            const data = await query('categories').insert(
                categories.map(({ categoryName, currencyId }) => ({ userId, categoryName, currencyId })),
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
