import { IIncome, AccountStatusType, Time, ErrorCode, DEFAULT_INCOME_COLOR_IDS, Utils } from '@tenpercent/shared';

import { ICreateIncome } from 'interfaces/ICreateIncome';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { BaseError } from 'src/utils/errors/BaseError';
import { DBError } from 'src/utils/errors/DBError';
import { isBaseError } from 'src/utils/errors/isBaseError';
import { NotFoundError } from 'src/utils/errors/NotFoundError';
import { resolveAccessibleItems, assertAccessibleIds } from 'src/utils/resolveAccessibleItems';
import { getOnlyNotEmptyProperties } from 'src/utils/validation/getOnlyNotEmptyProperties';
import { validateAllowedProperties } from 'src/utils/validation/validateAllowedProperties';

export interface IIncomeDataAccess {
    create(userId: number, incomes: ICreateIncome[], trx?: IDBTransaction): Promise<IIncome[]>;
    gets(userId: number): Promise<IIncome[] | undefined>;
    get(userId: number, categoryId: number): Promise<IIncome | undefined>;
    patch(userId: number, incomeId: number, properties: Partial<IIncome>, trx?: IDBTransaction): Promise<number>;
    delete(userId: number, incomeId: number, trx?: IDBTransaction): Promise<boolean>;
}

export default class IncomeDataAccess extends LoggerBase implements IIncomeDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    public async create(userId: number, incomes: ICreateIncome[], trx?: IDBTransaction): Promise<IIncome[]> {
        this._logger.info(`Starting creation of incomes for userId ${userId}`);

        try {
            const query = trx || this._db.engine();
            const maxPositionRow = await query('incomes').where({ userId }).max('position as maxPosition').first();
            const nextPosition = Number(maxPositionRow?.maxPosition ?? 0) + 1;
            const data = await query('incomes').insert(
                incomes.map(({ incomeName, currencyCode, iconId, colorId }, index) => ({
                    userId,
                    incomeName,
                    currencyCode,
                    status: AccountStatusType.Enable,
                    iconId,
                    colorId: colorId ?? DEFAULT_INCOME_COLOR_IDS[(nextPosition + index - 1) % DEFAULT_INCOME_COLOR_IDS.length],
                    position: nextPosition + index,
                })),
                ['incomeId', 'userId', 'incomeName', 'currencyCode', 'colorId', 'position'],
            );

            this._logger.info(`Successfully created incomes for userId ${userId}`);
            return data;
        } catch (e) {
            this._logger.error(`Error creating incomes for userId ${userId}: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Creating income failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.INCOME_ERROR,
            });
        }
    }

    public async gets(userId: number): Promise<IIncome[] | undefined> {
        this._logger.info(`Fetching incomes for userId ${userId}`);

        try {
            const { incomeIds } = await resolveAccessibleItems(this._db.engine(), userId);
            assertAccessibleIds(incomeIds, 'incomes');
            const query = await this._db
                .engine()('incomes')
                .select(
                    'incomes.incomeId',
                    'incomes.userId',
                    'incomes.incomeName',
                    'incomes.currencyCode',
                    'incomes.createdAt',
                    'incomes.updatedAt',
                    'incomes.iconId',
                    'incomes.colorId',
                    'incomes.position',
                    'currencies.currencyCode',
                    'currencies.currencyName',
                    'currencies.symbol',
                )
                .innerJoin('currencies', 'incomes.currencyCode', 'currencies.currencyCode')
                .where({ 'status': AccountStatusType.Enable, 'incomes.isDeleted': false })
                .whereIn('incomes.incomeId', incomeIds ?? [])
                .orderBy('incomes.position', 'asc')
                .orderBy('incomes.incomeId', 'asc');
            const data = await query;

            this._logger.info(`Successfully fetched incomes for userId ${userId}`);
            return Utils.greaterThen0(data?.length)
                ? data.map((data) => ({
                      ...data,
                      isOwner: data.userId === userId,
                      userId: undefined,
                      createdAt: data?.createdAt ? Time.fromJSDateUTC(data.createdAt) : undefined,
                      updatedAt: data?.updatedAt ? Time.fromJSDateUTC(data.updatedAt) : undefined,
                  }))
                : [];
        } catch (e) {
            this._logger.error(`Error fetching incomes for userId ${userId}: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Fetching incomes failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.INCOME_ERROR,
            });
        }
    }

    public async get(userId: number, incomeId: number): Promise<IIncome | undefined> {
        this._logger.info(`Fetching income with ID ${incomeId} for userId ${userId}`);

        try {
            const { incomeIds } = await resolveAccessibleItems(this._db.engine(), userId);
            assertAccessibleIds(incomeIds, 'incomes');
            const data = await this._db
                .engine()('incomes')
                .select(
                    'incomes.incomeId',
                    'incomes.userId',
                    'incomes.incomeName',
                    'incomes.currencyCode',
                    'incomes.createdAt',
                    'incomes.updatedAt',
                    'incomes.iconId',
                    'incomes.colorId',
                    'incomes.position',
                    'currencies.currencyCode',
                    'currencies.currencyName',
                    'currencies.symbol',
                )
                .innerJoin('currencies', 'incomes.currencyCode', 'currencies.currencyCode')
                .where({ incomeId, 'status': AccountStatusType.Enable, 'incomes.isDeleted': false })
                .whereIn('incomes.incomeId', incomeIds ?? [])
                .first();

            if (data) {
                this._logger.info(`Successfully fetched income with ID ${incomeId} for userId ${userId}`);
            } else {
                throw new NotFoundError({
                    message: `No income found with ID ${incomeId} for userId ${userId}`,
                    errorCode: ErrorCode.INCOME_ERROR,
                });
            }

            return {
                ...data,
                createdAt: data?.createdAt ? Time.fromJSDateUTC(data.createdAt) : undefined,
                updatedAt: data?.updatedAt ? Time.fromJSDateUTC(data.updatedAt) : undefined,
                isOwner: data.userId === userId,
                userId: undefined,
            };
        } catch (e) {
            this._logger.error(
                `Error fetching income with ID ${incomeId} for userId ${userId}: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Fetching income failed due to a database error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: ErrorCode.INCOME_ERROR,
            });
        }
    }

    async patch(userId: number, incomeId: number, properties: Partial<IIncome>, trx?: IDBTransaction): Promise<number> {
        try {
            this._logger.info(`Patch incomeId: ${incomeId} for userId: ${userId}`);
            const allowedProperties = {
                incomeName: properties.incomeName,
                updatedAt: Time.getISODateNowUTC(),
                status: properties.status,
                iconId: properties.iconId,
                colorId: properties.colorId,
                position: properties.position,
            };

            const allowedKeys = ['incomeName', 'updatedAt', 'status', 'iconId', 'colorId', 'position'];
            validateAllowedProperties(allowedProperties, allowedKeys);
            const properestForUpdate = getOnlyNotEmptyProperties(allowedProperties, allowedKeys);
            const query = trx || this._db.engine();
            const data = await query('incomes').update(properestForUpdate).where({ userId, incomeId, isDeleted: false });

            if (!data) {
                throw new NotFoundError({
                    message: `Income with incomeId: ${incomeId} not found for userId: ${userId}`,

                    errorCode: ErrorCode.INCOME_ERROR,
                });
            } else {
                this._logger.info(`Income incomeId: ${incomeId} for userId: ${userId} patched successful`);
            }

            return data;
        } catch (e) {
            this._logger.error(
                `Failed to patch income with incomeId: ${incomeId} for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Patch income failed due to a database error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: ErrorCode.INCOME_ERROR,
            });
        }
    }
    async delete(userId: number, incomeId: number, trx?: IDBTransaction): Promise<boolean> {
        try {
            this._logger.info(`Delete incomeID: ${incomeId} for userId: ${userId}`);

            const query = trx || this._db.engine();
            const data = await query('incomes').update({ isDeleted: true }).where({ userId, incomeId, isDeleted: false });
            if (!data) {
                throw new NotFoundError({
                    message: `Income with incomeId: ${incomeId} not found for userId: ${userId}`,

                    errorCode: ErrorCode.INCOME_ERROR,
                });
            }
            this._logger.info(`Income incomeId: ${incomeId} for userId: ${userId} delete successful`);
            return true;
        } catch (e) {
            this._logger.error(
                `Failed income deleting with incomeId: ${incomeId} for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Delete income failed due to a database error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: isBaseError(e) ? (e as unknown as BaseError)?.getErrorCode() : ErrorCode.INCOME_ERROR,
            });
        }
    }
}
