import { ICategory, Time, ErrorCode, StatsScope, Utils } from '@tenpercent/shared';

import { ICreateCategory } from 'interfaces/ICreateCategory';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { BaseError } from 'src/utils/errors/BaseError';
import { DBError } from 'src/utils/errors/DBError';
import { isBaseError } from 'src/utils/errors/isBaseError';
import { NotFoundError } from 'src/utils/errors/NotFoundError';
import { resolveAccessibleItems, assertAccessibleIds } from 'src/utils/resolveAccessibleItems';
import { getOnlyNotEmptyProperties } from 'src/utils/validation/getOnlyNotEmptyProperties';
import { validateAllowedProperties } from 'src/utils/validation/validateAllowedProperties';

export interface ICategoryDataAccess {
    delete(userId: number, incomeId: number, trx?: IDBTransaction): Promise<boolean>;
    patch(userId: number, incomeId: number, properties: Partial<ICategory>, trx?: IDBTransaction): Promise<number>;
    create(userId: number, categories: ICreateCategory[], trx?: IDBTransaction): Promise<ICategory[]>;
    gets(userId: number, scope?: StatsScope): Promise<ICategory[] | undefined>;
    get(userId: number, categoryId: number): Promise<ICategory | undefined>;
}
export default class CategoryDataAccess extends LoggerBase implements ICategoryDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }
    async create(userId: number, categories: ICreateCategory[], trx?: IDBTransaction): Promise<ICategory[]> {
        this._logger.info(`Creating categories for user: ${userId}`);
        const query = trx || this._db.engine();

        try {
            const maxPositionRow = await query('categories').where({ userId }).max('position as maxPosition').first();
            const nextPosition = Number(maxPositionRow?.maxPosition ?? 0) + 1;
            const formattedCategories = categories.map(({ categoryName, currencyCode, iconId, colorId, budget }, index) => ({
                userId,
                categoryName,
                currencyCode,
                iconId,
                colorId: colorId ?? null,
                budget,
                position: nextPosition + index,
            }));

            const data = await query('categories').insert(formattedCategories, [
                'categoryId',
                'userId',
                'categoryName',
                'currencyCode',
                'iconId',
                'colorId',
                'budget',
                'position',
            ]);

            this._logger.info(`Categories created successfully for user: ${userId}`);
            return data;
        } catch (e) {
            this._logger.error(`Failed to create categories for user: ${userId}. Error: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Failed to create categories for user: ${userId}. Error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: isBaseError(e) ? (e as unknown as BaseError)?.getErrorCode() : ErrorCode.CATEGORY_ERROR,
            });
        }
    }

    async gets(userId: number, scope?: StatsScope): Promise<ICategory[] | undefined> {
        this._logger.info(`Retrieving categories for user: ${userId} scope: ${scope ?? StatsScope.All}`);

        try {
            const { categoryIds } = await resolveAccessibleItems(this._db.engine(), userId, scope);
            assertAccessibleIds(categoryIds, 'categories');
            const query = this.getCategoryBaseQuery()
                .innerJoin('currencies', 'categories.currencyCode', 'currencies.currencyCode')
                .where({ 'categories.isDeleted': false })
                .whereIn('categories.categoryId', categoryIds ?? [])
                .orderBy('categories.position', 'asc')
                .orderBy('categories.categoryId', 'asc');

            const data = await query;
            if (data) {
                this._logger.info(`Fetched ${data.length} categories retrieved successfully for user: ${userId}`);
            } else {
                this._logger.warn(`Categories not found for user: ${userId}`);
            }
            return Utils.greaterThen0(data?.length)
                ? data.map((data) => ({
                      ...data,
                      isOwner: data.userId === userId,
                      createdAt: data?.createdAt ? Time.fromJSDateUTC(data.createdAt) : undefined,
                      updatedAt: data?.updatedAt ? Time.fromJSDateUTC(data.updatedAt) : undefined,
                      userId: undefined,
                  }))
                : [];
        } catch (e) {
            this._logger.error(`Failed to retrieve categories for user: ${userId}. Error: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Failed to retrieve categories for user: ${userId}. Error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: isBaseError(e) ? (e as unknown as BaseError)?.getErrorCode() : ErrorCode.CATEGORY_ERROR,
            });
        }
    }

    async get(userId: number, categoryId: number): Promise<ICategory | undefined> {
        this._logger.info(`Retrieving category ID ${categoryId} for user: ${userId}`);
        try {
            const { categoryIds } = await resolveAccessibleItems(this._db.engine(), userId);
            assertAccessibleIds(categoryIds, 'categories');

            const data = await this.getCategoryBaseQuery()
                .innerJoin('currencies', 'categories.currencyCode', 'currencies.currencyCode')
                .where({ categoryId, 'categories.isDeleted': false })
                .whereIn('categories.categoryId', categoryIds ?? [])
                .first();

            if (data) {
                this._logger.info(`Category ID ${categoryId} retrieved successfully for user: ${userId}`);
            } else {
                throw new NotFoundError({
                    errorCode: ErrorCode.CATEGORY_ERROR,
                    message: `Category ID ${categoryId} not found for user: ${userId}`,
                });
            }

            return {
                ...data,
                isOwner: data.userId === userId,
                createdAt: data?.createdAt ? Time.fromJSDateUTC(data.createdAt) : undefined,
                updatedAt: data?.updatedAt ? Time.fromJSDateUTC(data.updatedAt) : undefined,
                userId: undefined,
            };
        } catch (e) {
            this._logger.error(
                `Failed to retrieve category ID ${categoryId} for user: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Failed to retrieve category ID ${categoryId} for user: ${userId}. Error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: isBaseError(e) ? (e as unknown as BaseError)?.getErrorCode() : ErrorCode.CATEGORY_ERROR,
            });
        }
    }

    async patch(userId: number, categoryId: number, properties: Partial<ICategory>, trx?: IDBTransaction): Promise<number> {
        try {
            this._logger.info(`Patch categoryId: ${categoryId} for userId: ${userId}`);
            const allowedProperties = {
                categoryName: properties.categoryName,
                iconId: properties.iconId,
                colorId: properties.colorId,
                updatedAt: Time.getISODateNowUTC(),
                status: properties.status,
                budget: properties.budget,
                position: properties.position,
            };

            const allowedKeys = ['categoryName', 'iconId', 'colorId', 'updatedAt', 'status', 'budget', 'position'];
            validateAllowedProperties(allowedProperties, allowedKeys);
            const properestForUpdate = getOnlyNotEmptyProperties(allowedProperties, allowedKeys);
            const query = trx || this._db.engine();
            const data = await query('categories').update(properestForUpdate).where({ userId, categoryId });

            if (!data) {
                throw new NotFoundError({
                    errorCode: ErrorCode.CATEGORY_ERROR,
                    message: `Category with categoryId: ${categoryId} not found for userId: ${userId}`,
                });
            } else {
                this._logger.info(`Category categoryId: ${categoryId} for userId: ${userId} patched successful`);
            }

            return data;
        } catch (e) {
            this._logger.error(
                `Failed to patch category with categoryId: ${categoryId} for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Patch category failed due to a database error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: isBaseError(e) ? (e as unknown as BaseError)?.getErrorCode() : ErrorCode.CATEGORY_ERROR,
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
                    errorCode: ErrorCode.CATEGORY_ERROR,
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
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: isBaseError(e) ? (e as unknown as BaseError)?.getErrorCode() : ErrorCode.CATEGORY_ERROR,
            });
        }
    }
    protected getCategoryBaseQuery() {
        return this._db
            .engine()('categories')
            .select(
                'categories.categoryId',
                'categories.categoryName',
                'categories.currencyCode',
                'categories.userId',
                'categories.iconId',
                'categories.colorId',
                'categories.budget',
                'categories.position',
                'categories.createdAt',
                'categories.updatedAt',
                'currencies.currencyCode',
                'currencies.currencyName',
                'currencies.symbol',
            );
    }
}
