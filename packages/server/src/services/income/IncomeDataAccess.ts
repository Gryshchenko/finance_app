import { IIncome, AccountStatusType, Time, IIncomeStats, IGetStatsProperties } from 'tenpercent/shared';

import { ICreateIncome } from 'interfaces/ICreateIncome';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { BaseError } from 'src/utils/errors/BaseError';
import { DBError } from 'src/utils/errors/DBError';
import { isBaseError } from 'src/utils/errors/isBaseError';
import { NotFoundError } from 'src/utils/errors/NotFoundError';
import { getOnlyNotEmptyProperties } from 'src/utils/validation/getOnlyNotEmptyProperties';
import { validateAllowedProperties } from 'src/utils/validation/validateAllowedProperties';

export interface IIncomeDataAccess {
    getStats(userId: number, properties: IGetStatsProperties): Promise<IIncomeStats[]>;
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

    async getStats(userId: number, properties: IGetStatsProperties): Promise<IIncomeStats[]> {
        this._logger.info(`Retrieving income stats for user: ${userId}`);
        try {
            const { from, to } = properties;
            console.log(2222, from, to);
            const data = await this._db
                .engine()('incomes')
                .select(
                    'incomes.incomeId',
                    'incomes.userId',
                    'incomes.incomeName',
                    'incomes.currencyId',
                    'incomes.iconId',
                    this._db.engine().raw('COALESCE(SUM(dis.amount_total), 0) as amount'),
                )
                .leftJoin('daily_incomes_stats as dis', function () {
                    this.on('incomes.incomeId', '=', 'dis.incomeId')
                        .andOnVal('dis.userId', '=', userId)
                        .andOnBetween('dis.date', [from, to]);
                })
                .where('incomes.userId', userId)
                .groupBy('incomes.incomeId', 'incomes.userId', 'incomes.incomeName', 'incomes.currencyId');
            if (data) {
                this._logger.info(`Fetched ${data.length} incomes retrieved successfully for user: ${userId}`);
            } else {
                this._logger.warn(`Incomes stats not found for user: ${userId}`);
            }
            return data;
        } catch (e) {
            this._logger.error(
                `Failed to retrieve incomes stats for user: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Failed to retrieve incomes stats for user: ${userId}. Error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
            });
        }
    }
    public async create(userId: number, incomes: ICreateIncome[], trx?: IDBTransaction): Promise<IIncome[]> {
        this._logger.info(`Starting creation of incomes for userId ${userId}`);

        try {
            const query = trx || this._db.engine();
            const data = await query('incomes').insert(
                incomes.map(({ incomeName, currencyId, iconId }) => ({
                    userId,
                    incomeName,
                    currencyId,
                    status: AccountStatusType.Enable,
                    iconId,
                })),
                ['incomeId', 'userId', 'incomeName', 'currencyId'],
            );

            this._logger.info(`Successfully created incomes for userId ${userId}`);
            return data;
        } catch (e) {
            this._logger.error(`Error creating incomes for userId ${userId}: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Creating income failed due to a database error: ${(e as { message: string }).message}`,
            });
        }
    }

    public async gets(userId: number): Promise<IIncome[] | undefined> {
        this._logger.info(`Fetching incomes for userId ${userId}`);

        try {
            const data = await this.getIncomeBaseQuery()
                .innerJoin('currencies', 'incomes.currencyId', 'currencies.currencyId')
                .where({ userId, 'status': AccountStatusType.Enable, 'incomes.isDeleted': false });

            this._logger.info(`Successfully fetched incomes for userId ${userId}`);
            return data;
        } catch (e) {
            this._logger.error(`Error fetching incomes for userId ${userId}: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Fetching incomes failed due to a database error: ${(e as { message: string }).message}`,
            });
        }
    }

    public async get(userId: number, incomeId: number): Promise<IIncome | undefined> {
        this._logger.info(`Fetching income with ID ${incomeId} for userId ${userId}`);

        try {
            const data = await this.getIncomeBaseQuery()
                .innerJoin('currencies', 'incomes.currencyId', 'currencies.currencyId')
                .where({ userId, incomeId, status: AccountStatusType.Enable })
                .first();

            if (data) {
                this._logger.info(`Successfully fetched income with ID ${incomeId} for userId ${userId}`);
            } else {
                throw new NotFoundError({
                    message: `No income found with ID ${incomeId} for userId ${userId}`,
                });
            }

            return {
                ...data,
                createdAt: data?.createdAt ? Time.fromJSDateUTC(data.createdAt) : undefined,
                updatedAt: data?.updatedAt ? Time.fromJSDateUTC(data.updatedAt) : undefined,
            };
        } catch (e) {
            this._logger.error(
                `Error fetching income with ID ${incomeId} for userId ${userId}: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Fetching income failed due to a database error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
            });
        }
    }

    protected getIncomeBaseQuery() {
        return this._db
            .engine()('incomes')
            .select(
                'incomes.incomeId',
                'incomes.userId',
                'incomes.incomeName',
                'incomes.currencyId',
                'incomes.createdAt',
                'incomes.updatedAt',
                'incomes.iconId',
                'currencies.currencyCode',
                'currencies.currencyName',
                'currencies.symbol',
            );
    }
    async patch(userId: number, incomeId: number, properties: Partial<IIncome>, trx?: IDBTransaction): Promise<number> {
        try {
            this._logger.info(`Patch incomeId: ${incomeId} for userId: ${userId}`);
            const allowedProperties = {
                incomeName: properties.incomeName,
                updatedAt: Time.getISODateNowUTC(),
                status: properties.status,
                iconId: properties.iconId,
            };

            const allowedKeys = ['incomeName', 'updatedAt', 'status', 'iconId'];
            validateAllowedProperties(allowedProperties, allowedKeys);
            const properestForUpdate = getOnlyNotEmptyProperties(allowedProperties, allowedKeys);
            const query = trx || this._db.engine();
            const data = await query('incomes').update(properestForUpdate).where({ userId, incomeId, isDeleted: false });

            if (!data) {
                throw new NotFoundError({
                    message: `Income with incomeId: ${incomeId} not found for userId: ${userId}`,
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
            });
        }
    }
}
