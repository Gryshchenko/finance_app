import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'helper/logger/LoggerBase';
import { IBalance } from '../../../../shared/src/interfaces/IBalance';
import { NotFoundError } from 'src/utils/errors/NotFoundError';
import { DBError } from 'src/utils/errors/DBError';
import { isBaseError } from 'src/utils/errors/isBaseError';
import { BaseError } from 'src/utils/errors/BaseError';
import { validateAllowedProperties } from 'src/utils/validation/validateAllowedProperties';
import { Time, Utils } from 'tenpercent/shared';

export interface IBalanceDataAccess {
    get(userId: number): Promise<IBalance>;
    patch(userId: number, properties: { amount: number }, trx?: IDBTransaction): Promise<number>;
    post(userId: number, properties: { amount: number; currencyCode: string }, trx?: IDBTransaction): Promise<number>;
}

export default class BalanceDataAccess extends LoggerBase implements IBalanceDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }
    async get(userId: number): Promise<IBalance> {
        try {
            this._logger.info(`Fetching balance for userId: ${userId}`);

            const data = await this._db
                .engine()('balance')
                .select('balanceId', 'balance', 'updatedAt', 'createdAt')
                .where({ userId })
                .first();

            if (!data) {
                throw new NotFoundError({
                    message: `Balance not found for userId: ${userId}`,
                });
            } else {
                this._logger.info(`Fetched balance for userId: ${userId}`);
            }

            return data;
        } catch (e) {
            this._logger.error(`Failed to fetch balance for userId: ${userId}. Error: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Fetching balance failed due to a database error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
            });
        }
    }
    async post(userId: number, properties: { amount: number }, trx?: IDBTransaction): Promise<number> {
        try {
            this._logger.info(`Post balance for userId: ${userId}`);
            const allowedProperties = {
                balance: properties.amount,
            };
            validateAllowedProperties(allowedProperties, ['balance']);
            const query = trx || this._db.engine();
            const data = (await query<IBalance>('balance').insert(
                {
                    userId: String(userId),
                    balance: String(allowedProperties.balance),
                },
                'balanceId',
            )) as { balanceId: string }[];

            if (Utils.isArrayEmpty(data)) {
                throw new NotFoundError({
                    message: `Balance not found for userId: ${userId}`,
                });
            } else {
                this._logger.info(`Balance for userId: ${userId} created successfully`);
            }

            return Number(data[0].balanceId);
        } catch (e) {
            this._logger.error(`Failed to create balance for userId: ${userId}. Error: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Post balance failed due to a database error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
            });
        }
    }
    async patch(userId: number, properties: { amount: number }, trx?: IDBTransaction): Promise<number> {
        try {
            this._logger.info(`Patch balance for userId: ${userId}`);
            const allowedProperties = {
                balance: properties.amount,
                updatedAt: Time.getISODateNowUTC(),
            };
            validateAllowedProperties(allowedProperties, ['updatedAt', 'balance']);
            const query = trx || this._db.engine();
            const data = (await query.transaction(async (trx) => {
                return trx<IBalance>('balance')
                    .where('userId', userId)
                    .update(
                        {
                            balance: trx.raw('balance + ?', [allowedProperties.balance]),
                            updatedAt: trx.fn.now(),
                        },
                        'balance',
                    );
            })) as { balance: string }[];

            if (Utils.isArrayEmpty(data)) {
                throw new NotFoundError({
                    message: `Balance not found for userId: ${userId}`,
                });
            } else {
                this._logger.info(`Balance for userId: ${userId} patched successful`);
            }

            return Number(data[0].balance);
        } catch (e) {
            this._logger.error(`Failed to patch balance for userId: ${userId}. Error: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Patch balance failed due to a database error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
            });
        }
    }
}
