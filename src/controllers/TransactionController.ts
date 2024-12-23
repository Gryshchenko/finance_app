import { Request, Response } from 'express';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { ResponseStatusType } from 'types/ResponseStatusType';
import { ErrorCode } from 'types/ErrorCode';
import Logger from 'helper/logger/Logger';
import { HttpCode } from 'types/HttpCode';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';
import { BaseError } from 'src/utils/errors/BaseError';
import TransactionServiceBuilder from 'services/transaction/TransactionServiceBuilder';

export class TransactionController {
    private static readonly logger = Logger.Of('TransactionController');
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
                createAt = new Date().toISOString(),
                targetAccountId,
            } = req.body;
            const transactionId = await TransactionServiceBuilder.build().createTransaction({
                accountId,
                incomeId,
                categoryId,
                currencyId,
                transactionTypeId,
                amount,
                description,
                userId: req.session.user?.userId as number,
                createAt,
                targetAccountId,
            });
            res.status(HttpCode.CREATED).json(
                responseBuilder.setStatus(ResponseStatusType.OK).setData({ transactionId }).build(),
            );
        } catch (e: unknown) {
            TransactionController.logger.error(`Create transaction failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.TRANSACTION_ERROR);
        }
    }
}
