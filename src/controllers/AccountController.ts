import { Request, Response } from 'express';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { ErrorCode } from 'types/ErrorCode';
import Logger from 'helper/logger/Logger';
import { HttpCode } from 'types/HttpCode';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';
import { BaseError } from 'src/utils/errors/BaseError';
import AccountServiceBuilder from 'services/account/AccountServiceBuilder';
import { ResponseStatusType } from 'types/ResponseStatusType';

export class AccountController {
    private static readonly logger = Logger.Of('AccountController');
    public static async get(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const accountId = Number(req.params?.accountId);
            const account = await AccountServiceBuilder.build().getAccount(req.session.user?.userId as number, accountId);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(account).build());
        } catch (e: unknown) {
            AccountController.logger.error(`Create account failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.TRANSACTION_ERROR);
        }
    }
}
