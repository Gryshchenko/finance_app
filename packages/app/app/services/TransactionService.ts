import { IPagination } from 'tenpercent/shared';
import { ITransaction } from 'tenpercent/shared';
import { ITransactionListItem } from 'tenpercent/shared';
import { TransactionFieldType } from 'tenpercent/shared';

import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { Logger } from '@/utils/logger/Logger';

export class TransactionService extends ApiAbstract {
    protected readonly _logger: Logger = Logger.Of('TransactionService');

    private static _instance: TransactionService;

    public static instance(): TransactionService {
        return TransactionService._instance || (TransactionService._instance = new TransactionService());
    }

    public async doGetTransactions({
        id,
        type,
        cursor,
        limit,
        orderBy,
    }: {
        id?: number;
        type?: TransactionFieldType | undefined;
        cursor?: number;
        limit?: number;
        orderBy?: string;
    }): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IPagination<ITransactionListItem>;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            const field = this.validateTransactionFieldName(type);
            this._logger.info(`Start fetching transactions from ${field ?? 'all'}: ${id}`);
            const userId = this._authService.userId;
            const params = new URLSearchParams();
            if (field && id) {
                params.append(field, String(id));
            }
            if (cursor !== undefined) {
                params.append('cursor', String(cursor));
            }
            if (limit !== undefined) {
                params.append('limit', String(limit));
            }
            if (orderBy) {
                params.append('orderBy', orderBy);
            }
            const queryString = params.toString();
            const response = await this.authGet(`/user/${userId}/transactions${queryString ? `?${queryString}` : ''}`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(
                    `Fetching transactions successfully: ${(response.data as IPagination<ITransactionListItem>)?.data?.length}`,
                );
            } else {
                this._logger.info(`Fetching transaction failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doGetTransaction({ id }: { id: number | string }): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IPagination<ITransaction>;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info(`Start fetching transaction id: ${id}`);
            const userId = this._authService.userId;
            const response = await this.authGet(`/user/${userId}/transaction/${id}`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching transaction successfully: ${(response.data as ITransaction)?.transactionId}`);
            } else {
                this._logger.info(`Fetching transaction failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doDeleteTransaction(id: number): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IPagination<ITransaction>;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info(`Start deleting transaction id: ${id}`);
            const userId = this._authService.userId;
            const response = await this.authDelete(`/user/${userId}/transaction/${id}`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Delete transaction successfully: ${(response.data as ITransaction)?.transactionId}`);
            } else {
                this._logger.info(`Delete transaction failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doCreateTransaction(body: {
        accountId: number | undefined;
        incomeId: number | undefined;
        categoryId: number | undefined;
        currencyId: number | undefined;
        transactionTypeId: number | undefined;
        amount: number | undefined;
        createdAt: string | undefined;
        targetAccountId: number | undefined;
        description: string | undefined;
    }): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: ITransaction | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Start create transaction');
            const userId = this._authService.userId;
            const response = await this.authPost(`/user/${userId}/transaction`, {
                accountId: body.accountId,
                incomeId: body.incomeId,
                categoryId: body.categoryId,
                currencyId: body.currencyId,
                transactionTypeId: body.transactionTypeId,
                amount: body.amount,
                createdAt: body.createdAt,
                targetAccountId: body.targetAccountId,
                description: body.description,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Create transaction successfully: ${(response?.data as ITransaction)?.accountId}`);
            } else {
                this._logger.info(`Create transaction failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doPatchTransaction(
        id: number,
        body: {
            accountId: number | undefined;
            incomeId: number | undefined;
            categoryId: number | undefined;
            currencyId: number | undefined;
            amount: number | undefined;
            createdAt: string | undefined;
            targetAccountId: number | undefined;
            description: string | undefined;
        },
    ): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Start patch transaction');
            const userId = this._authService.userId;
            const response = await this.authPatch(`/user/${userId}/transaction/${id}`, {
                accountId: body.accountId,
                incomeId: body.incomeId,
                categoryId: body.categoryId,
                currencyId: body.currencyId,
                amount: body.amount,
                createdAt: body.createdAt,
                targetAccountId: body.targetAccountId,
                description: body.description,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Patch transaction successfully: ${(response.data as [])?.length}`);
            } else {
                this._logger.info(`Patch transaction failed: ${response.kind}`);
            }
            return response;
        });
    }

    protected validateTransactionFieldName(type: TransactionFieldType | undefined): TransactionFieldType | undefined {
        switch (type) {
            case TransactionFieldType.Category:
                return TransactionFieldType.Category;
            case TransactionFieldType.Income:
                return TransactionFieldType.Income;
            case TransactionFieldType.Account:
                return TransactionFieldType.Account;
            default:
                return undefined;
        }
    }
}
