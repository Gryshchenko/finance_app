import {
    IAccount,
    Time,
    Utils,
    AccountStatusType,
    IAccountListItem,
    ErrorCode,
    StatsScope,
    DEFAULT_ACCOUNT_COLOR_IDS,
} from '@tenpercent/shared';

import { ICreateAccount } from 'interfaces/ICreateAccount';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { BaseError } from 'src/utils/errors/BaseError';
import { DBError } from 'src/utils/errors/DBError';
import { isBaseError } from 'src/utils/errors/isBaseError';
import { NotFoundError } from 'src/utils/errors/NotFoundError';
import { resolveAccessibleItems, assertAccessibleIds } from 'src/utils/resolveAccessibleItems';
import { getOnlyNotEmptyProperties } from 'src/utils/validation/getOnlyNotEmptyProperties';
import { validateAllowedProperties } from 'src/utils/validation/validateAllowedProperties';

export interface IAccountDataAccess {
    createAccounts(userId: number, accounts: ICreateAccount[], trx?: IDBTransaction): Promise<IAccount[]>;
    getAccounts(userId: number, scope?: StatsScope): Promise<IAccountListItem[] | undefined>;
    getAccount(userId: number, accountId: number, status?: AccountStatusType): Promise<IAccount>;
    patchAccount(userId: number, accountId: number, properties: Partial<IAccount>, trx?: IDBTransaction): Promise<number>;
    addAmount(userId: number, accountId: number, amount: number, trx?: IDBTransaction): Promise<number>;
    deleteAccount(userId: number, accountId: number, trx?: IDBTransaction): Promise<boolean>;
}

export default class AccountDataAccess extends LoggerBase implements IAccountDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }
    async createAccounts(userId: number, accounts: ICreateAccount[], trx?: IDBTransaction): Promise<IAccount[]> {
        try {
            this._logger.info(`Starting account creation for userId: ${userId}`);
            for (const account of accounts) {
                validateAllowedProperties(account as unknown as Record<string, string | number>, [
                    'accountName',
                    'amount',
                    'currencyCode',
                    'iconId',
                    'colorId',
                ]);
            }
            const query = trx || this._db.engine();
            const maxPositionRow = await query('accounts').where({ userId }).max('position as maxPosition').first();
            const nextPosition = Number(maxPositionRow?.maxPosition ?? 0) + 1;
            const data = await query('accounts').insert(
                accounts.map(({ accountName, currencyCode, amount, iconId, colorId }, index) => ({
                    userId,
                    accountName,
                    currencyCode,
                    iconId,
                    colorId: colorId ?? DEFAULT_ACCOUNT_COLOR_IDS[(nextPosition + index - 1) % DEFAULT_ACCOUNT_COLOR_IDS.length],
                    status: AccountStatusType.Enable,
                    amount: Number(amount.toFixed(2)),
                    position: nextPosition + index,
                })),
                ['accountId', 'userId', 'accountName', 'currencyCode', 'amount', 'iconId', 'colorId', 'position'],
            );

            this._logger.info(`Successfully created ${data.length} accounts for userId: ${userId}`);
            return data;
        } catch (e) {
            this._logger.error(`Failed to create accounts for userId: ${userId}. Error: ${(e as { message: string }).message}`);
            throw new DBError({
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: isBaseError(e) ? (e as unknown as BaseError)?.getErrorCode() : ErrorCode.ACCOUNT_ERROR,
                message: `Account creation failed due to a database error: ${(e as { message: string }).message}`,
            });
        }
    }

    async getAccounts(userId: number, scope?: StatsScope): Promise<IAccountListItem[] | undefined> {
        try {
            this._logger.info(`Fetching all accounts for userId: ${userId} scope: ${scope ?? StatsScope.All}`);

            const { accountIds } = await resolveAccessibleItems(this._db.engine(), userId, scope);
            assertAccessibleIds(accountIds, 'accounts');
            const query = this._db
                .engine()('accounts')
                .select(
                    'accounts.accountId',
                    'accounts.amount',
                    'accounts.accountName',
                    'accounts.currencyCode',
                    'accounts.iconId',
                    'accounts.userId',
                    'accounts.colorId',
                    'accounts.position',
                    'accounts.createdAt',
                    'accounts.updatedAt',
                )
                .where({ 'status': AccountStatusType.Enable, 'accounts.isDeleted': false })
                .whereIn('accounts.accountId', accountIds ?? []);
            query.orderBy('accounts.position', 'asc').orderBy('accounts.accountId', 'asc');

            const data = await query;
            if (!data.length) {
                this._logger.info(`No accounts found for userId: ${userId}`);
            } else {
                this._logger.info(`Fetched ${data.length} accounts for userId: ${userId}`);
            }

            return Utils.greaterThen0(data?.length)
                ? data.map((data) => ({
                      ...data,
                      amount: Number(data?.amount) ?? 0,
                      isOwner: data.userId === userId,
                      userId: undefined,
                      createdAt: data?.createdAt ? Time.fromJSDateUTC(data.createdAt) : undefined,
                      updatedAt: data?.updatedAt ? Time.fromJSDateUTC(data.updatedAt) : undefined,
                  }))
                : [];
        } catch (e) {
            this._logger.error(`Failed to fetch accounts for userId: ${userId}. Error: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Fetching accounts failed due to a database error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: isBaseError(e) ? (e as unknown as BaseError)?.getErrorCode() : ErrorCode.ACCOUNT_ERROR,
            });
        }
    }

    async getAccount(userId: number, accountId: number): Promise<IAccount> {
        try {
            this._logger.info(`Fetching account with accountId: ${accountId} for userId: ${userId}`);

            const { accountIds } = await resolveAccessibleItems(this._db.engine(), userId);
            assertAccessibleIds(accountIds, 'accounts');
            const data = await this._db
                .engine()('accounts')
                .select(
                    'accounts.accountId',
                    'accounts.amount',
                    'accounts.accountName',
                    'accounts.currencyCode',
                    'accounts.iconId',
                    'accounts.userId',
                    'accounts.colorId',
                    'accounts.position',
                    'accounts.createdAt',
                    'accounts.updatedAt',
                    'currencies.currencyCode',
                    'currencies.symbol',
                )
                .innerJoin('currencies', 'accounts.currencyCode', 'currencies.currencyCode')
                .where({ accountId, 'status': AccountStatusType.Enable, 'accounts.isDeleted': false })
                .whereIn('accounts.accountId', accountIds ?? [])
                .first();

            if (!data) {
                throw new NotFoundError({
                    errorCode: ErrorCode.ACCOUNT_ERROR,
                    message: `Account with accountId: ${accountId} not found for userId: ${userId}`,
                });
            } else {
                this._logger.info(`Fetched account with accountId: ${accountId} for userId: ${userId}`);
            }

            return {
                ...data,
                isOwner: data.userId === userId,
                amount: Utils.isNotNull(data.amount) ? Number(data.amount) : 0,
                userId: undefined,
                createdAt: data?.createdAt ? Time.fromJSDateUTC(data.createdAt) : undefined,
                updatedAt: data?.updatedAt ? Time.fromJSDateUTC(data.updatedAt) : undefined,
            };
        } catch (e) {
            this._logger.error(
                `Failed to fetch account with accountId: ${accountId} for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Fetching account failed due to a database error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: isBaseError(e) ? (e as unknown as BaseError)?.getErrorCode() : ErrorCode.ACCOUNT_ERROR,
            });
        }
    }

    async patchAccount(userId: number, accountId: number, properties: Partial<IAccount>, trx?: IDBTransaction): Promise<number> {
        try {
            this._logger.info(`Patch accountId: ${accountId} for userId: ${userId}`);
            const allowedProperties: Record<string, string | number | undefined | unknown> = {
                accountName: properties.accountName,
                amount: properties.amount,
                iconId: properties.iconId,
                colorId: properties.colorId,
                updatedAt: Time.getISODateNowUTC(),
                status: properties.status,
                position: properties.position,
            };

            const allowedKeys = ['accountName', 'amount', 'iconId', 'colorId', 'updatedAt', 'status', 'position'];
            validateAllowedProperties(allowedProperties, allowedKeys);
            const properestForUpdate = getOnlyNotEmptyProperties(allowedProperties, allowedKeys);
            const query = trx || this._db.engine();
            const data = await query('accounts').update(properestForUpdate).where({ userId, accountId, isDeleted: false });

            if (!data) {
                throw new NotFoundError({
                    errorCode: ErrorCode.ACCOUNT_ERROR,
                    message: `Account with accountId: ${accountId} not found for userId: ${userId}`,
                });
            } else {
                this._logger.info(`Account accountId: ${accountId} for userId: ${userId} patched successful`);
            }

            return data;
        } catch (e) {
            this._logger.error(
                `Failed to patch account with accountId: ${accountId} for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Patch account failed due to a database error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: isBaseError(e) ? (e as unknown as BaseError)?.getErrorCode() : ErrorCode.ACCOUNT_ERROR,
            });
        }
    }

    async addAmount(userId: number, accountId: number, amount: number, trx?: IDBTransaction): Promise<number> {
        try {
            this._logger.info(`Add amount ${amount} to accountId: ${accountId} for userId: ${userId}`);

            const { accountIds } = await resolveAccessibleItems(this._db.engine(), userId);
            assertAccessibleIds(accountIds, 'accounts');
            const query = trx || this._db.engine();
            const data = await query('accounts')
                .update({
                    amount: this._db.engine().raw('amount + ?', [amount]),
                    updatedAt: Time.getISODateNowUTC(),
                })
                .where({ accountId, isDeleted: false })
                .whereIn('accountId', accountIds ?? []);

            if (!data) {
                throw new NotFoundError({
                    errorCode: ErrorCode.ACCOUNT_ERROR,
                    message: `Account with accountId: ${accountId} not found for userId: ${userId}`,
                });
            } else {
                this._logger.info(`Account accountId: ${accountId} for userId: ${userId} amount updated successful`);
            }

            return data;
        } catch (e) {
            this._logger.error(
                `Failed to add amount to account with accountId: ${accountId} for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Add amount to account failed due to a database error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: isBaseError(e) ? (e as unknown as BaseError)?.getErrorCode() : ErrorCode.ACCOUNT_ERROR,
            });
        }
    }

    async deleteAccount(userId: number, accountId: number, trx?: IDBTransaction): Promise<boolean> {
        try {
            this._logger.info(`Delete accountID: ${accountId} for userId: ${userId}`);

            const query = trx || this._db.engine();
            const data = await query('accounts').update({ isDeleted: true }).where({ userId, accountId, isDeleted: false });
            if (!data) {
                throw new NotFoundError({
                    errorCode: ErrorCode.ACCOUNT_ERROR,
                    message: `Account with accountId: ${accountId} not found for userId: ${userId}`,
                });
            }
            this._logger.info(`Account accountId: ${accountId} for userId: ${userId} delete successful`);
            return true;
        } catch (e) {
            this._logger.error(
                `Failed account deleting with accountId: ${accountId} for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Delete account failed due to a database error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: isBaseError(e) ? (e as unknown as BaseError)?.getErrorCode() : ErrorCode.ACCOUNT_ERROR,
            });
        }
    }
}
