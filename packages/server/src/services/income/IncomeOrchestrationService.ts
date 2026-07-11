import { ErrorCode, HttpCode, Utils } from '@tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IIncomeService } from 'services/income/IncomeService';
import { ITransactionService } from 'services/transaction/TransactionService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import { UnitOfWork } from 'src/repositories/UnitOfWork';
import { CustomError } from 'src/utils/errors/CustomError';
import { AccountType } from 'types/AccountType';

export class IncomeOrchestrationService extends LoggerBase {
    private readonly _incomeService: IIncomeService;
    private readonly _transactionService: ITransactionService;
    constructor({
        incomeService,
        transactionService,
    }: {
        incomeService: IIncomeService;
        transactionService: ITransactionService;
    }) {
        super();
        this._incomeService = incomeService;
        this._transactionService = transactionService;
    }

    public async delete(userId: number, incomeId: number, keepData: boolean): Promise<boolean> {
        return this.withTransaction(async (trx: IDBTransaction) => {
            try {
                if (!keepData) {
                    await this._transactionService.deleteTransactionsForEntity(
                        userId,
                        AccountType.Income,
                        incomeId,
                        trx as unknown as IDBTransaction,
                    );
                }
                return await this._incomeService.delete(userId, incomeId, trx as unknown as IDBTransaction);
            } catch (e: unknown) {
                this._logger.error(`Delete income failed due reason: ${(e as { message: string }).message}`);
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
                    message: 'Transaction not initiated. User could not be created',
                    errorCode: ErrorCode.INCOME_ERROR,
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
