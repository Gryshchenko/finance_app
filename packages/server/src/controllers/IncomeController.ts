import { Request, Response } from 'express';
import { ErrorCode, HttpCode, ResponseStatusType, StatsPeriod, Utils } from 'tenpercent/shared';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import IncomeServiceBuilder from 'services/income/IncomeServiceBuilder';
import TransactionServiceBuilder from 'services/transaction/TransactionServiceBuilder';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import { UnitOfWork } from 'src/repositories/UnitOfWork';
import { BaseError } from 'src/utils/errors/BaseError';
import { CustomError } from 'src/utils/errors/CustomError';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';

export class IncomeController {
    private static readonly logger = Logger.Of('IncomeController');
    public static async getStats(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const from = String(req.query?.from);
            const to = String(req.query?.to);
            const period = String(req.query?.period) as StatsPeriod;
            const category = await IncomeServiceBuilder.build().getStats(req.user?.userId as number, {
                from,
                to,
                period,
            });
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(category).build());
        } catch (e: unknown) {
            IncomeController.logger.error(`Get income stats failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.INCOME_ERROR);
        }
    }
    public static async get(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const incomeId = Number(req.params?.incomeId);
            const income = await IncomeServiceBuilder.build().get(req.user?.userId as number, incomeId);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(income).build());
        } catch (e: unknown) {
            IncomeController.logger.error(`Get income failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.INCOME_ERROR);
        }
    }
    public static async gets(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const income = await IncomeServiceBuilder.build().gets(req.user?.userId as number);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(income).build());
        } catch (e: unknown) {
            IncomeController.logger.error(`Create accounts failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.INCOME_ERROR);
        }
    }
    public static async post(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const { incomeName, currencyId, iconId } = req.body;
            const income = await IncomeServiceBuilder.build().create(req.user?.userId as number, {
                incomeName,
                currencyId,
                iconId,
            });
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(income).build());
        } catch (e: unknown) {
            IncomeController.logger.error(`Create income failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.INCOME_ERROR);
        }
    }
    public static async delete(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        const db: IDatabaseConnection = DatabaseConnectionBuilder.build();
        const uow = new UnitOfWork(db);
        try {
            const userId = Number(req.user?.userId);
            const incomeId = Number(req.params?.incomeId);
            const incomeService = IncomeServiceBuilder.build(db);
            const transactionService = TransactionServiceBuilder.build(db);
            await uow.start();
            const trx = uow.getTransaction();
            if (Utils.isNull(trx)) {
                throw new CustomError({
                    message: 'Transaction not initiated. User could not be created',
                    errorCode: ErrorCode.INCOME_ERROR,
                    statusCode: HttpCode.INTERNAL_SERVER_ERROR,
                });
            }
            await transactionService.deleteTransactionsForAccount(userId, incomeId, trx as unknown as IDBTransaction);
            await incomeService.delete(userId, incomeId, trx as unknown as IDBTransaction);
            await uow.commit();
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            await uow.rollback();
            IncomeController.logger.error(`Delete income failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.INCOME_ERROR);
        }
    }
    public static async patch(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const incomeId = Number(req.params?.incomeId);
            const { incomeName, status, iconId, position } = req.body;
            if (Utils.isEmpty(incomeName) && Utils.isNull(status) && Utils.isEmpty(iconId) && Utils.isNull(position)) {
                throw new ValidationError({ message: 'Path income failed due reason: empty body' });
            }
            await IncomeServiceBuilder.build().patch(req.user?.userId as number, incomeId, {
                incomeName,
                status,
                iconId,
                position,
            });
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            IncomeController.logger.error(`Patch income failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.INCOME_ERROR);
        }
    }
}
