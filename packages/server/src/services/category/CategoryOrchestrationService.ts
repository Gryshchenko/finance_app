import { ErrorCode, HttpCode, Utils } from '@tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { ICategoryService } from 'services/category/CategoryService';
import { ITransactionService } from 'services/transaction/TransactionService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import { UnitOfWork } from 'src/repositories/UnitOfWork';
import { CustomError } from 'src/utils/errors/CustomError';
import { AccountType } from 'types/AccountType';

export class CategoryOrchestrationService extends LoggerBase {
    private readonly _categoryService: ICategoryService;
    private readonly _transactionService: ITransactionService;
    constructor({
        categoryService,
        transactionService,
    }: {
        categoryService: ICategoryService;
        transactionService: ITransactionService;
    }) {
        super();
        this._categoryService = categoryService;
        this._transactionService = transactionService;
    }

    public async delete(userId: number, categoryId: number, keepData: boolean): Promise<boolean> {
        return this.withTransaction(async (trx: IDBTransaction) => {
            try {
                if (!keepData) {
                    await this._transactionService.deleteTransactionsForEntity(
                        userId,
                        AccountType.Expense,
                        categoryId,
                        trx as unknown as IDBTransaction,
                    );
                }
                return await this._categoryService.delete(userId, categoryId, trx as unknown as IDBTransaction);
            } catch (e: unknown) {
                this._logger.error(`Delete category failed due reason: ${(e as { message: string }).message}`);
                throw e;
            }
        });
    }

    private async withTransaction<T>(processor: (trx: IDBTransaction) => Promise<T>): Promise<T> {
        const db: IDatabaseConnection = DatabaseConnectionBuilder.build();
        const uow = new UnitOfWork(db);
        try {
            await uow.start();
            const trx = uow.getTransaction();
            if (Utils.isNull(trx)) {
                throw new CustomError({
                    message: 'Transaction not initiated',
                    errorCode: ErrorCode.CATEGORY_ERROR,
                    statusCode: HttpCode.INTERNAL_SERVER_ERROR,
                });
            }

            const response = await processor(trx as unknown as IDBTransaction);
            await uow.commit();
            return response;
        } catch (e: unknown) {
            await uow.rollback();
            throw e;
        }
    }
}
