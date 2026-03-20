import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { ICreateCategory } from 'interfaces/ICreateCategory';
import { ICategory } from 'tenpercent/shared';
import { DBError } from 'src/utils/errors/DBError';
import { BaseError } from 'src/utils/errors/BaseError';
import { NotFoundError } from 'src/utils/errors/NotFoundError';
import { isBaseError } from 'src/utils/errors/isBaseError';
import { validateAllowedProperties } from 'src/utils/validation/validateAllowedProperties';
import { IGetStatsProperties } from 'tenpercent/shared';
import { ICategoryStats } from 'tenpercent/shared';
import { DateFormat, Time } from 'tenpercent/shared';

export interface ICategoryDataAccess {
    getStats(userId: number, properties: IGetStatsProperties): Promise<ICategoryStats[]>;
    delete(userId: number, incomeId: number, trx?: IDBTransaction): Promise<boolean>;
    patch(userId: number, incomeId: number, properties: Partial<ICategory>, trx?: IDBTransaction): Promise<number>;
    create(userId: number, categories: ICreateCategory[], trx?: IDBTransaction): Promise<ICategory[]>;
    gets(userId: number): Promise<ICategory[] | undefined>;
    get(userId: number, categoryId: number): Promise<ICategory | undefined>;
}
export default class CategoryDataAccess extends LoggerBase implements ICategoryDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }
    async getStats(userId: number, properties: IGetStatsProperties): Promise<ICategoryStats[]> {
        this._logger.info(`Retrieving categories stats for user: ${userId}`);
        try {
            const { from, to } = properties;
            const data = await this._db
                .engine()('categories')
                .select(
                    'categories.categoryId',
                    'categories.userId',
                    'categories.categoryName',
                    'categories.currencyId',
                    'categories.iconId',
                    this._db.engine().raw('COALESCE(SUM(dcs.amount_total), 0) as amount'),
                )
                .leftJoin('daily_categories_stats as dcs', function () {
                    this.on('categories.categoryId', '=', 'dcs.categoryId')
                        .andOnVal('dcs.userId', '=', userId)
                        .andOnBetween('dcs.date', [
                            Time.formatDate(from, DateFormat.YYYY_MM_DD),
                            Time.formatDate(to, DateFormat.YYYY_MM_DD),
                        ]);
                })
                .where('categories.userId', userId)
                .groupBy(
                    'categories.categoryId',
                    'categories.userId',
                    'categories.categoryName',
                    'categories.currencyId',
                    'categories.iconId',
                );
            if (data) {
                this._logger.info(`Fetched ${data.length} categories retrieved successfully for user: ${userId}`);
            } else {
                this._logger.warn(`Categories stats not found for user: ${userId}`);
            }
            return data;
        } catch (e) {
            this._logger.error(
                `Failed to retrieve categories stats for user: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Failed to retrieve categories stats for user: ${userId}. Error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
            });
        }
    }

    async create(userId: number, categories: ICreateCategory[], trx?: IDBTransaction): Promise<ICategory[]> {
        this._logger.info(`Creating categories for user: ${userId}`);
        const query = trx || this._db.engine();

        try {
            const formattedCategories = categories.map(({ categoryName, currencyId, iconId }) => ({
                userId,
                categoryName,
                currencyId,
                iconId,
            }));

            const data = await query('categories').insert(formattedCategories, [
                'categoryId',
                'userId',
                'categoryName',
                'currencyId',
                'iconId',
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

    async gets(userId: number): Promise<ICategory[] | undefined> {
        this._logger.info(`Retrieving categories for user: ${userId}`);

        try {
            const data = await this.getCategoryBaseQuery()
                .innerJoin('currencies', 'categories.currencyId', 'currencies.currencyId')
                .where({ userId, 'categories.isDeleted': false });

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
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
            });
        }
    }

    async get(userId: number, categoryId: number): Promise<ICategory | undefined> {
        this._logger.info(`Retrieving category ID ${categoryId} for user: ${userId}`);

        try {
            const data = await this.getCategoryBaseQuery()
                .innerJoin('currencies', 'categories.currencyId', 'currencies.currencyId')
                .where({ userId, categoryId, 'categories.isDeleted': false })
                .first();

            if (data) {
                this._logger.info(`Category ID ${categoryId} retrieved successfully for user: ${userId}`);
            } else {
                throw new NotFoundError({
                    message: `Category ID ${categoryId} not found for user: ${userId}`,
                });
            }

            return {
                ...data,
                createdAt: data?.createdAt ? Time.fromJSDateUTC(data.createdAt) : undefined,
                updatedAt: data?.updatedAt ? Time.fromJSDateUTC(data.updatedAt) : undefined,
            };
        } catch (e) {
            this._logger.error(
                `Failed to retrieve category ID ${categoryId} for user: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Failed to retrieve category ID ${categoryId} for user: ${userId}. Error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
            });
        }
    }

    async patch(userId: number, categoryId: number, properties: Partial<ICategory>, trx?: IDBTransaction): Promise<number> {
        try {
            this._logger.info(`Patch categoryId: ${categoryId} for userId: ${userId}`);
            const allowedProperties = {
                categoryName: properties.categoryName,
                iconId: properties.iconId,
                updatedAt: Time.getISODateNowUTC(),
                status: properties.status,
            };

            validateAllowedProperties(allowedProperties, ['categoryName', 'iconId', 'updatedAt', 'status']);
            const query = trx || this._db.engine();
            const data = await query('categories').update(properties).where({ userId, categoryId });

            if (!data) {
                throw new NotFoundError({
                    message: `Category with categoryId: ${categoryId} not found for userId: ${userId}`,
                });
            } else {
                this._logger.info(`Category categoryId: ${categoryId} for userId: ${userId} patched successful`);
            }

            return data;
        } catch (e) {
            this._logger.error(
                `Failed to fetch category with categoryId: ${categoryId} for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Patch category failed due to a database error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
            });
        }
    }
    async delete(userId: number, categoryId: number, trx?: IDBTransaction): Promise<boolean> {
        try {
            this._logger.info(`Delete categoryID: ${categoryId} for userId: ${userId}`);

            const query = trx || this._db.engine();
            const data = await query('categories').update({ isDeleted: true }).where({ userId, categoryId, isDeleted: false });
            if (!data) {
                throw new NotFoundError({
                    message: `Category with categoryId: ${categoryId} not found for userId: ${userId}`,
                });
            }
            this._logger.info(`Category categoryId: ${categoryId} for userId: ${userId} delete successful`);
            return true;
        } catch (e) {
            this._logger.error(
                `Failed category deleting with categoryId: ${categoryId} for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Delete category failed due to a database error: ${(e as { message: string }).message}`,
            });
        }
    }
    protected getCategoryBaseQuery() {
        return this._db
            .engine()('categories')
            .select(
                'categories.categoryId',
                'categories.userId',
                'categories.categoryName',
                'categories.currencyId',
                'categories.iconId',
                'categories.createdAt',
                'categories.updatedAt',
                'currencies.currencyCode',
                'currencies.currencyName',
                'currencies.symbol',
            );
    }
}
