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
    async getCategories(userId: number): Promise<ICategory[] | undefined> {
        try {
            this._logger.info('getCategories request');

            const data = await this.getCategoryBaseQuery()
                .innerJoin('currencies', 'categories.currencyId', 'currencies.currencyId')
                .where({ userId });
            this._logger.info('getCategories response');
            return data;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
    async getCategory(userId: number, categoryId: number): Promise<ICategory | undefined> {
        try {
            this._logger.info('getCategory request');
            const data = await this.getCategoryBaseQuery().where({ userId, categoryId }).first();
            this._logger.info('getCategory response');
            return data;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
    protected getCategoryBaseQuery() {
        return this._db.engine()('categories').select(
            'categories.categoryId',
            'categories.userId',
            // 'categories.amount',
            'categories.categoryName',
            'categories.currencyId',
            'currencies.currencyCode',
            'currencies.currencyName',
            'currencies.symbol',
        );
    }
}
