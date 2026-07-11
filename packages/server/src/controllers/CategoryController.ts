import { ErrorCode, HttpCode, ResponseStatusType, Utils } from '@tenpercent/shared';
import { Request, Response } from 'express';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import CategoryServiceBuilder from 'services/category/CategoryServiceBuilder';
import { StatsOrchestratorServiceBuilder } from 'services/StatsOrchestrator/StatsOrchestratorServiceBuilder';
import TransactionServiceBuilder from 'services/transaction/TransactionServiceBuilder';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import { UnitOfWork } from 'src/repositories/UnitOfWork';
import { BaseError } from 'src/utils/errors/BaseError';
import { CustomError } from 'src/utils/errors/CustomError';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';
import { AccountType } from 'types/AccountType';

export class CategoryController {
    private static readonly logger = Logger.Of('CategoryController');
    public static async getStats(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const from = String(req.query?.from);
            const to = String(req.query?.to);
            const category = await StatsOrchestratorServiceBuilder.build().categoriesStats(req.user?.userId as number, from, to);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(category).build());
        } catch (e: unknown) {
            CategoryController.logger.error(`Get category stats failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.INCOME_ERROR);
        }
    }
    public static async get(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const categoryId = Number(req.params?.categoryId);
            const category = await CategoryServiceBuilder.build().get(req.user?.userId as number, categoryId);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(category).build());
        } catch (e: unknown) {
            CategoryController.logger.error(`Get category failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.INCOME_ERROR);
        }
    }
    public static async gets(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const category = await CategoryServiceBuilder.build().gets(req.user?.userId as number);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(category).build());
        } catch (e: unknown) {
            CategoryController.logger.error(`Create categories failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.INCOME_ERROR);
        }
    }
    public static async post(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const { categoryName, currencyCode, iconId, budget } = req.body;
            const category = await CategoryServiceBuilder.build().create(req.user?.userId as number, {
                categoryName,
                currencyCode,
                iconId,
                budget,
            });
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(category).build());
        } catch (e: unknown) {
            CategoryController.logger.error(`Create category failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.INCOME_ERROR);
        }
    }
    public static async delete(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        const db: IDatabaseConnection = DatabaseConnectionBuilder.build();
        const uow = new UnitOfWork(db);
        try {
            const userId = Number(req.user?.userId);
            const categoryId = Number(req.params?.categoryId);
            const categoryService = CategoryServiceBuilder.build(db);
            const transactionService = TransactionServiceBuilder.build(db);
            await uow.start();
            const trx = uow.getTransaction();
            if (Utils.isNull(trx)) {
                throw new CustomError({
                    message: 'Transaction not initiated',
                    errorCode: ErrorCode.INCOME_ERROR,
                    statusCode: HttpCode.INTERNAL_SERVER_ERROR,
                });
            }
            await transactionService.deleteTransactionsForEntity(
                userId,
                AccountType.Expense,
                categoryId,
                trx as unknown as IDBTransaction,
            );
            await categoryService.delete(userId, categoryId, trx as unknown as IDBTransaction);
            await uow.commit();
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            await uow.rollback();
            CategoryController.logger.error(`Delete category failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.INCOME_ERROR);
        }
    }
    public static async patch(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const categoryId = Number(req.params?.categoryId);
            const { categoryName, status, iconId, colorId, budget, position } = req.body;
            if (
                Utils.isEmpty(categoryName) &&
                Utils.isNull(status) &&
                Utils.isEmpty(iconId) &&
                Utils.isEmpty(colorId) &&
                Utils.isNull(budget) &&
                Utils.isNull(position)
            ) {
                throw new ValidationError({ message: 'Path category failed due reason: empty body' });
            }
            await CategoryServiceBuilder.build().patch(req.user?.userId as number, categoryId, {
                categoryName,
                status,
                iconId,
                colorId,
                budget,
                position,
            });
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            CategoryController.logger.error(`Patch category failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.INCOME_ERROR);
        }
    }
}
