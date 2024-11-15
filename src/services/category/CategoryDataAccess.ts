import { ICategoryDataAccess } from 'interfaces/ICategoryDataAccess';
import { IDatabaseConnection, ITransaction } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { ICreateCategory } from 'interfaces/ICreateCategory';
import { ICategory } from 'interfaces/ICategory';
import { DBError } from 'src/utils/errors/DBError';

export default class CategoryDataAccess extends LoggerBase implements ICategoryDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    async createCategories(userId: number, categories: ICreateCategory[], trx?: ITransaction): Promise<ICategory[]> {
        this._logger.info(`Creating categories for user: ${userId}`);
        const query = trx || this._db.engine();

        try {
            const formattedCategories = categories.map(({ categoryName, currencyId }) => ({
                userId,
                categoryName,
                currencyId,
            }));

            const data = await query('categories').insert(formattedCategories, [
                'categoryId',
                'userId',
                'categoryName',
                'currencyId',
            ]);

            this._logger.info(`Categories created successfully for user: ${userId}`);
            return data;
        } catch (e) {
            this._logger.error(`Failed to create categories for user: ${userId}. Error: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Failed to create categories for user: ${userId}. Error: ${(e as { message: string }).message}`,
            });
        }
    }

    async getCategories(userId: number): Promise<ICategory[] | undefined> {
        this._logger.info(`Retrieving categories for user: ${userId}`);

        try {
            const data = await this.getCategoryBaseQuery()
                .innerJoin('currencies', 'categories.currencyId', 'currencies.currencyId')
                .where({ userId });

            if (data) {
                this._logger.info(`Fetched ${data.length} categories retrieved successfully for user: ${userId}`);
            } else {
                this._logger.warn(`Categories not found for user: ${userId}`);
            }
            return data;
        } catch (e) {
            this._logger.error(`Failed to retrieve categories for user: ${userId}. Error: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Failed to retrieve categories for user: ${userId}. Error: ${(e as { message: string }).message}`,
            });
        }
    }

    async getCategory(userId: number, categoryId: number): Promise<ICategory | undefined> {
        this._logger.info(`Retrieving category ID ${categoryId} for user: ${userId}`);

        try {
            const data = await this.getCategoryBaseQuery().where({ userId, categoryId }).first();

            if (data) {
                this._logger.info(`Category ID ${categoryId} retrieved successfully for user: ${userId}`);
            } else {
                this._logger.warn(`Category ID ${categoryId} not found for user: ${userId}`);
            }

            return data;
        } catch (e) {
            this._logger.error(
                `Failed to retrieve category ID ${categoryId} for user: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Failed to retrieve category ID ${categoryId} for user: ${userId}. Error: ${(e as { message: string }).message}`,
            });
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
