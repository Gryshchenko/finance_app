import {
    ITransaction,
    Time,
    Utils,
    IPagination,
    ITransactionListItemsRequest,
    ITransactionListItem,
    ErrorCode,
    TransactionType,
} from 'tenpercent/shared';

import { ICreateTransaction } from 'interfaces/ICreateTransaction';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { BaseError } from 'src/utils/errors/BaseError';
import { DBError } from 'src/utils/errors/DBError';
import { isBaseError } from 'src/utils/errors/isBaseError';
import { NotFoundError } from 'src/utils/errors/NotFoundError';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { validateAllowedProperties } from 'src/utils/validation/validateAllowedProperties';

interface ICursorData {
    createdAt: string;
    transactionId: number;
}

function encodeCursor(data: ICursorData): string {
    return Buffer.from(JSON.stringify(data)).toString('base64');
}

function decodeCursor(cursor: string): ICursorData {
    try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
        if (typeof decoded?.createdAt !== 'string' || typeof decoded?.transactionId !== 'number') {
            throw new Error();
        }
        return decoded;
    } catch {
        throw new ValidationError({ message: 'Invalid cursor format' });
    }
}

export interface ITransactionStatsRequest {
    userId: number;
    from: string;
    to: string;
    incomeId?: number;
    categoryId?: number;
    accountId?: number;
}

// One (currency, day) bucket of native-amount sums per transaction type, computed on read from transactions.
export interface ITransactionStatsBucket {
    currencyCode: string;
    date: string;
    income_total: number;
    expense_total: number;
    transfer_total: number;
}

export interface ITransactionEntityStatsRequest {
    userId: number;
    from: string;
    to: string;
    groupBy: 'categoryId' | 'incomeId' | 'accountId';
}

// Per-entity (currency) sums over a period — for "all categories/incomes with stats" lists.
export interface ITransactionEntityStatsBucket {
    entityId: number;
    currencyCode: string;
    income_total: number;
    expense_total: number;
    transfer_total: number;
}

export interface ITransactionDataAccess {
    createTransaction(transaction: ICreateTransaction, trx?: IDBTransaction): Promise<number>;
    getStats(request: ITransactionStatsRequest): Promise<ITransactionStatsBucket[]>;
    getStatsByEntity(request: ITransactionEntityStatsRequest): Promise<ITransactionEntityStatsBucket[]>;
    getTransactions(data: ITransactionListItemsRequest): Promise<IPagination<ITransactionListItem>>;
    getTransaction(userId: number, transactionId: number, trx?: IDBTransaction): Promise<ITransaction | undefined>;
    patchTransaction(userId: number, properties: Partial<ITransaction>, trx?: IDBTransaction): Promise<number>;
    deleteTransaction(userId: number, transactionId: number, trx?: IDBTransaction): Promise<boolean>;
    deleteTransactionsForAccount(userId: number, accountId: number, trx?: IDBTransaction): Promise<boolean>;
}

export default class TransactionDataAccess extends LoggerBase implements ITransactionDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    // Read-time analytics: per (currency, day) income/expense/transfer sums over [from, to],
    // optionally narrowed to a single income / category / account. Replaces the materialized daily_* tables.
    async getStats(request: ITransactionStatsRequest): Promise<ITransactionStatsBucket[]> {
        const { userId, from, to, incomeId, categoryId, accountId } = request;
        try {
            const knex = this._db.engine();
            const query = knex('transactions')
                .select(
                    'currencyCode',
                    knex.raw(`to_char("createdAt", 'YYYY-MM-DD') as date`),
                    knex.raw(`COALESCE(SUM(amount) FILTER (WHERE "transactionTypeId" = ?), 0) as income_total`, [
                        TransactionType.Income,
                    ]),
                    knex.raw(`COALESCE(SUM(amount) FILTER (WHERE "transactionTypeId" = ?), 0) as expense_total`, [
                        TransactionType.Expense,
                    ]),
                    knex.raw(`COALESCE(SUM(amount) FILTER (WHERE "transactionTypeId" = ?), 0) as transfer_total`, [
                        TransactionType.Transafer,
                    ]),
                )
                .where({ userId, isDeleted: false })
                .whereRaw(`"createdAt"::date >= ?::date AND "createdAt"::date <= ?::date`, [from, to])
                .groupBy('currencyCode')
                .groupByRaw(`to_char("createdAt", 'YYYY-MM-DD')`);

            if (Utils.isNotNull(incomeId)) query.andWhere({ incomeId });
            if (Utils.isNotNull(categoryId)) query.andWhere({ categoryId });
            if (Utils.isNotNull(accountId)) query.andWhere({ accountId });

            const rows = await query;
            return rows.map(
                (row: {
                    currencyCode: string;
                    date: string;
                    income_total: string;
                    expense_total: string;
                    transfer_total: string;
                }) => ({
                    currencyCode: row.currencyCode,
                    date: row.date,
                    income_total: Number(row.income_total),
                    expense_total: Number(row.expense_total),
                    transfer_total: Number(row.transfer_total),
                }),
            );
        } catch (e) {
            this._logger.error(`Get transaction stats failed for userId: ${userId}: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Get transaction stats failed: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.STATS_ERROR,
            });
        }
    }
    // Read-time analytics grouped by entity (category/income/account): one row per (entity, currency)
    // with native-amount sums per type. Powers the "categories/incomes with stats" lists.
    async getStatsByEntity(request: ITransactionEntityStatsRequest): Promise<ITransactionEntityStatsBucket[]> {
        const { userId, from, to, groupBy } = request;
        if (!['categoryId', 'incomeId', 'accountId'].includes(groupBy)) {
            throw new ValidationError({ message: `Unsupported stats groupBy: ${groupBy}`, errorCode: ErrorCode.STATS_ERROR });
        }
        try {
            const knex = this._db.engine();
            const rows = await knex('transactions')
                .select(
                    knex.raw('?? as "entityId"', [groupBy]),
                    'currencyCode',
                    knex.raw(`COALESCE(SUM(amount) FILTER (WHERE "transactionTypeId" = ?), 0) as income_total`, [
                        TransactionType.Income,
                    ]),
                    knex.raw(`COALESCE(SUM(amount) FILTER (WHERE "transactionTypeId" = ?), 0) as expense_total`, [
                        TransactionType.Expense,
                    ]),
                    knex.raw(`COALESCE(SUM(amount) FILTER (WHERE "transactionTypeId" = ?), 0) as transfer_total`, [
                        TransactionType.Transafer,
                    ]),
                )
                .where({ userId, isDeleted: false })
                .whereNotNull(groupBy)
                .whereRaw(`"createdAt"::date >= ?::date AND "createdAt"::date <= ?::date`, [from, to])
                .groupBy(groupBy)
                .groupBy('currencyCode');

            return rows.map(
                (row: {
                    entityId: number;
                    currencyCode: string;
                    income_total: string;
                    expense_total: string;
                    transfer_total: string;
                }) => ({
                    entityId: Number(row.entityId),
                    currencyCode: row.currencyCode,
                    income_total: Number(row.income_total),
                    expense_total: Number(row.expense_total),
                    transfer_total: Number(row.transfer_total),
                }),
            );
        } catch (e) {
            this._logger.error(`Get entity stats failed for userId: ${userId}: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Get entity stats failed: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.STATS_ERROR,
            });
        }
    }
    async createTransaction(transaction: ICreateTransaction, trx?: IDBTransaction): Promise<number> {
        try {
            this._logger.info(`Starting transaction creation for userId: ${transaction.userId}`);

            const query = trx || this._db.engine();
            const data = await query('transactions').insert(
                {
                    accountId: transaction.accountId,
                    incomeId: transaction.incomeId,
                    categoryId: transaction.categoryId,
                    currencyCode: transaction.currencyCode,
                    transactionTypeId: transaction.transactionTypeId,
                    amount: transaction.amount,
                    description: transaction.description,
                    userId: transaction.userId,
                    createdAt: transaction.createdAt,
                    targetAccountId: transaction.targetAccountId,
                    targetCurrencyCode: transaction.targetCurrencyCode,
                    targetAmount: transaction.targetAmount,
                },
                ['transactionId'],
            );

            this._logger.info(`Successfully created ${data.length} transactions for userId: ${transaction.userId}`);
            return data[0].transactionId;
        } catch (e) {
            this._logger.error(
                `Failed to create transactions for userId: ${transaction.userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Transaction creation failed due to a database error: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.TRANSACTION_ERROR,
            });
        }
    }

    async getTransactions({
        userId,
        limit = 20,
        cursor,
        accountId,
        categoryId,
        incomeId,
    }: ITransactionListItemsRequest): Promise<IPagination<ITransactionListItem>> {
        try {
            const cleanFilters =
                Object.fromEntries(
                    Object.entries({
                        'transactions.accountId': accountId,
                        'transactions.categoryId': categoryId,
                        'transactions.incomeId': incomeId,
                    }).filter(([_, value]) => value !== undefined),
                ) ?? {};
            this._logger.info(`Fetching transactions {${Object.entries(cleanFilters).join(': ')}} for userId: ${userId}`);

            const query = this._db
                .engine()('transactions')
                .select<
                    ITransactionListItem[]
                >('transactions.transactionId', 'transactions.amount', 'transactions.description', 'transactions.createdAt', 'transactions.currencyCode', 'transactions.targetAccountId', 'transactions.transactionTypeId', 'incomes.incomeName', 'categories.categoryName', 'sourceAccount.accountName', 'targetAccount.accountName as targetAccountName', 'transactions.targetCurrencyCode', 'transactions.targetAmount')
                .leftJoin('incomes', 'transactions.incomeId', 'incomes.incomeId')
                .leftJoin('categories', 'transactions.categoryId', 'categories.categoryId')
                .leftJoin({ sourceAccount: 'accounts' }, 'transactions.accountId', 'sourceAccount.accountId')
                .leftJoin({ targetAccount: 'accounts' }, 'transactions.targetAccountId', 'targetAccount.accountId')
                .where({
                    'transactions.userId': userId,
                    'transactions.isDeleted': false,
                });
            if (incomeId !== undefined) {
                query.where({
                    'transactions.incomeId': incomeId,
                });
            }
            if (categoryId !== undefined) {
                query.where({
                    'transactions.categoryId': categoryId,
                });
            }
            if (accountId !== undefined) {
                query.where(function () {
                    this.where('transactions.accountId', accountId).orWhere('transactions.targetAccountId', accountId);
                });
            }
            if (cursor) {
                const { createdAt: cursorCreatedAt, transactionId: cursorTransactionId } = decodeCursor(cursor);
                query.andWhere(function () {
                    this.where('transactions.createdAt', '<', cursorCreatedAt).orWhere(function () {
                        this.where('transactions.createdAt', '=', cursorCreatedAt).andWhere(
                            'transactions.transactionId',
                            '<',
                            cursorTransactionId,
                        );
                    });
                });
            }

            query.orderBy('transactions.createdAt', 'desc');
            query.orderBy('transactions.transactionId', 'desc');
            query.limit(limit);

            const data = await query;

            if (!data.length) {
                this._logger.info(`No transactions found for userId: ${userId}`);
            } else {
                this._logger.info(`Fetched ${data.length} transactions for userId: ${userId}`);
            }

            const lastItem = data[data.length - 1];
            const nextCursor = lastItem
                ? encodeCursor({ createdAt: lastItem.createdAt, transactionId: lastItem.transactionId })
                : null;

            return {
                data: Utils.greaterThen0(data?.length) ? data : [],
                cursor: nextCursor,
                limit,
            };
        } catch (e) {
            this._logger.error(
                `Failed to fetch transactions for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Fetching transactions failed due to a database error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: ErrorCode.TRANSACTION_ERROR,
            });
        }
    }

    async getTransaction(userId: number, transactionId: number, trx?: IDBTransaction): Promise<ITransaction | undefined> {
        try {
            this._logger.info(`Fetching transaction with transactionId: ${transactionId} for userId: ${userId}`);

            const query = trx || this._db.engine();
            const data = await query('transactions')
                .select(
                    'transactions.transactionId',
                    'transactions.amount',
                    'transactions.categoryId',
                    'transactions.accountId',
                    'transactions.incomeId',
                    'transactions.description',
                    'transactions.createdAt',
                    'transactions.updatedAt',
                    'transactions.currencyCode',
                    'transactions.targetAccountId',
                    'transactions.transactionTypeId',
                    'transactions.targetCurrencyCode',
                    'transactions.targetAmount',
                )
                .where({ userId, transactionId, 'transactions.isDeleted': false })
                .first();

            if (!data) {
                throw new NotFoundError({
                    message: `Transaction with transactionId: ${transactionId} not found for userId: ${userId}`,
                    errorCode: ErrorCode.TRANSACTION_ERROR,
                });
            } else {
                this._logger.info(`Fetched transaction with transactionId: ${transactionId} for userId: ${userId}`);
            }
            return {
                ...data,
                createdAt: data?.createdAt ? Time.fromJSDateUTC(data.createdAt) : undefined,
                updatedAt: data?.updatedAt ? Time.fromJSDateUTC(data.updatedAt) : undefined,
            };
        } catch (e) {
            this._logger.error(
                `Failed to fetch transaction with transactionId: ${transactionId} for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Fetching transaction failed due to a database error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: isBaseError(e) ? (e as unknown as BaseError)?.getErrorCode() : ErrorCode.TRANSACTION_ERROR,
            });
        }
    }

    async patchTransaction(userId: unknown, properties: Partial<ITransaction>, trx?: IDBTransaction): Promise<number> {
        const { transactionId } = properties;
        try {
            this._logger.info(`Patch transactionId: ${transactionId} for userId: ${userId}`);
            const query = trx || this._db.engine();
            const allowedProperties: Record<string, string | number | undefined | unknown> = {
                accountId: properties.accountId,
                incomeId: properties.incomeId,
                categoryId: properties.categoryId,
                amount: properties.amount,
                description: properties.description,
                targetAccountId: properties.targetAccountId,
                createdAt: properties.createdAt,
                updatedAt: Time.getISODateNowUTC(),
                targetCurrencyCode: properties.targetCurrencyCode,
                targetAmount: properties.targetAmount,
                currencyCode: properties.currencyCode,
            };

            validateAllowedProperties(allowedProperties, [
                'accountId',
                'incomeId',
                'categoryId',
                'amount',
                'description',
                'targetAccountId',
                'createdAt',
                'updatedAt',
                'targetCurrencyCode',
                'targetAmount',
                'currencyCode',
            ]);
            const data = await query('transactions').update(allowedProperties).where({ userId, transactionId, isDeleted: false });

            if (!data) {
                throw new NotFoundError({
                    message: `Transaction with transactionId: ${transactionId} not found for userId: ${userId}`,
                    errorCode: ErrorCode.TRANSACTION_ERROR,
                });
            } else {
                this._logger.info(`Transaction transactionId: ${transactionId} for userId: ${userId} patched successful`);
            }
            return data;
        } catch (e) {
            this._logger.error(
                `Failed to patch transaction with transactionId: ${transactionId} for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Patch transaction failed due to a database error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: isBaseError(e) ? (e as unknown as BaseError)?.getErrorCode() : ErrorCode.TRANSACTION_ERROR,
            });
        }
    }

    async deleteTransaction(userId: number, transactionId: number, trx?: IDBTransaction): Promise<boolean> {
        try {
            this._logger.info(`Delete transactionId: ${transactionId} for userId: ${userId}`);

            const query = trx || this._db.engine();
            const data = await query('transactions')
                .update({ isDeleted: true })
                .where({ userId, transactionId, isDeleted: false });
            if (!data) {
                throw new NotFoundError({
                    message: `Transaction with transactionId: ${transactionId} not found for userId: ${userId}`,
                    errorCode: ErrorCode.TRANSACTION_ERROR,
                });
            }
            this._logger.info(`Transaction transactionId: ${transactionId} for userId: ${userId} delete successful`);
            return true;
        } catch (e) {
            this._logger.error(
                `Failed transaction deleting with transactionId: ${transactionId} for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Delete transaction failed due to a database error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: isBaseError(e) ? (e as unknown as BaseError)?.getErrorCode() : ErrorCode.TRANSACTION_ERROR,
            });
        }
    }
    public async deleteTransactionsForAccount(userId: number, accountId: number, trx?: IDBTransaction): Promise<boolean> {
        try {
            this._logger.info(`Delete transactions for accountId ${accountId} for userId: ${userId}`);

            const query = trx || this._db.engine();
            const deletedCount = await query('transactions')
                .update({ isDeleted: true })
                .where({ userId, accountId, isDeleted: false });
            if (deletedCount === 0) {
                this._logger.info(`Transactions for accountId ${accountId} for userId: ${userId} not found`);
                return false;
            } else {
                this._logger.info(
                    `Transaction transactions count: ${deletedCount} for accountId ${accountId} for userId: ${userId} delete successful`,
                );
                return true;
            }
        } catch (e) {
            this._logger.error(
                `Failed transactions deleting for accountId ${accountId} for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw new DBError({
                message: `Delete transactions for accountId failed due to a database error: ${(e as { message: string }).message}`,
                statusCode: isBaseError(e) ? (e as unknown as BaseError)?.getStatusCode() : undefined,
                errorCode: ErrorCode.TRANSACTION_ERROR,
            });
        }
    }
}
