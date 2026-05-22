import { Request, Response } from 'express';
import { ResponseStatusType, Time, ErrorCode, HttpCode, Utils, ITransactionListItem } from 'tenpercent/shared';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import TransactionServiceBuilder from 'services/transaction/TransactionServiceBuilder';
import { BaseError } from 'src/utils/errors/BaseError';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';

export class TransactionController {
    private static readonly logger = Logger.Of('TransactionController');

    public static async delete(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            await TransactionServiceBuilder.build().deleteTransaction(
                req.user?.userId as number,
                Number(req.params.transactionId),
            );
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            TransactionController.logger.error(`Delete transaction failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.TRANSACTION_ERROR);
        }
    }
    public static async get(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const transaction = await TransactionServiceBuilder.build().getTransaction(
                req.user?.userId as number,
                Number(req.params.transactionId),
            );
            if (Utils.isNull(transaction) || Utils.isObjectEmpty(transaction as unknown as Record<string, unknown>)) {
                res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
            } else {
                res.status(HttpCode.OK).json(
                    responseBuilder
                        .setStatus(ResponseStatusType.OK)
                        .setData({
                            transactionId: transaction?.transactionId,
                            accountId: transaction?.accountId,
                            targetAccountId: transaction?.targetAccountId,
                            incomeId: transaction?.incomeId,
                            categoryId: transaction?.categoryId,
                            currencyId: transaction?.currencyId,
                            currencyCode: transaction?.currencyCode,
                            currencyName: transaction?.currencyName,
                            symbol: transaction?.symbol,
                            transactionTypeId: transaction?.transactionTypeId,
                            amount: transaction?.amount,
                            description: transaction?.description,
                            createdAt: transaction?.createdAt,
                        })
                        .build(),
                );
            }
        } catch (e: unknown) {
            TransactionController.logger.error(`Get transaction failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.TRANSACTION_ERROR);
        }
    }

    public static async getAll(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const accountId = Utils.greaterThen0(Number(req.query.accountId)) ? Number(req.query.accountId) : undefined;
            const categoryId = Utils.greaterThen0(Number(req.query.categoryId)) ? Number(req.query.categoryId) : undefined;
            const incomeId = Utils.greaterThen0(Number(req.query.incomeId)) ? Number(req.query.incomeId) : undefined;
            const { data, limit, cursor } = await TransactionServiceBuilder.build().getTransactions({
                userId: Number(req.user?.userId),
                limit: Number(req.query.limit),
                cursor: Utils.isNotEmpty(req.query.cursor as string) ? (req.query.cursor as string) : undefined,
                accountId,
                categoryId,
                incomeId,
            });

            const transactionCount = data?.length ?? 0;
            if (Utils.isNull(data) || !Utils.greaterThen0(transactionCount)) {
                res.status(HttpCode.OK).json(
                    responseBuilder
                        .setStatus(ResponseStatusType.OK)
                        .setData({
                            limit,
                            cursor,
                            data: [],
                        })
                        .build(),
                );
            } else {
                const response = {
                    limit,
                    cursor,
                    data: data.map((transaction: ITransactionListItem | null) => ({
                        incomeName: transaction?.incomeName,
                        categoryName: transaction?.categoryName,
                        accountName: transaction?.accountName,
                        targetAccountName: transaction?.targetAccountName,
                        transactionTypeId: transaction?.transactionTypeId,
                        transactionId: transaction?.transactionId,
                        currencyId: transaction?.currencyId,
                        amount: transaction?.amount,
                        description: transaction?.description,
                        createdAt: transaction?.createdAt,
                    })),
                };
                res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(response).build());
            }
        } catch (e: unknown) {
            TransactionController.logger.error(`Get transactions failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.TRANSACTION_ERROR);
        }
    }

    public static async create(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const {
                accountId,
                incomeId,
                categoryId,
                currencyId,
                transactionTypeId,
                amount,
                description,
                createdAt = Time.getISODateNowUTC(),
                targetAccountId,
                targetAmount,
                targetCurrencyId,
            } = req.body;
            const transactionId = await TransactionServiceBuilder.build().createTransaction({
                accountId,
                incomeId,
                categoryId,
                currencyId,
                transactionTypeId,
                amount,
                description,
                userId: req.user?.userId as number,
                createdAt,
                targetAccountId,
                targetAmount,
                targetCurrencyId,
            });
            res.status(HttpCode.CREATED).json(
                responseBuilder.setStatus(ResponseStatusType.OK).setData({ transactionId }).build(),
            );
        } catch (e: unknown) {
            TransactionController.logger.error(`Create transaction failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.TRANSACTION_ERROR);
        }
    }

    public static async patch(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const {
                accountId,
                incomeId,
                categoryId,
                amount,
                description,
                createdAt,
                targetAccountId,
                targetAmount,
                targetCurrencyId,
            } = req.body;
            await TransactionServiceBuilder.build().patchTransaction(req.user?.userId as number, {
                transactionId: Number(req.params.transactionId),
                accountId,
                incomeId,
                categoryId,
                amount,
                description,
                createdAt,
                targetAccountId,
                targetAmount,
                targetCurrencyId,
            });
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            TransactionController.logger.error(`Patch transaction failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.TRANSACTION_ERROR);
        }
    }
}
