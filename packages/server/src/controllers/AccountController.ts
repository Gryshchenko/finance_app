import { ErrorCode, HttpCode, ResponseStatusType, Utils } from '@tenpercent/shared';
import { Request, Response } from 'express';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { AccountOrchestrationServiceBuilder } from 'services/account/AccountOrchestrationServiceBuilder';
import AccountServiceBuilder from 'services/account/AccountServiceBuilder';
import { BaseError } from 'src/utils/errors/BaseError';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';

export class AccountController {
    private static readonly logger = Logger.Of('AccountController');
    public static async get(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const accountId = Number(req.params?.accountId);
            const account = await AccountServiceBuilder.build().getAccount(req.user?.userId as number, accountId);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(account).build());
        } catch (e: unknown) {
            AccountController.logger.error(`Get account failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.ACCOUNT_ERROR);
        }
    }
    public static async gets(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const account = await AccountServiceBuilder.build().getAccounts(req.user?.userId as number);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(account).build());
        } catch (e: unknown) {
            AccountController.logger.error(`Create accounts failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.ACCOUNT_ERROR);
        }
    }
    public static async post(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const { accountName, amount, currencyCode, iconId } = req.body;
            const account = await AccountOrchestrationServiceBuilder.build().create(req.user?.userId as number, {
                accountName,
                amount,
                currencyCode,
                iconId,
            });
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(account).build());
        } catch (e: unknown) {
            AccountController.logger.error(`Create account failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.ACCOUNT_ERROR);
        }
    }
    public static async delete(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userId = Number(req.user?.userId);
            const accountId = Number(req.params?.accountId);
            await AccountOrchestrationServiceBuilder.build().delete(userId, accountId);
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            AccountController.logger.error(`Delete account failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.ACCOUNT_ERROR);
        }
    }
    public static async patch(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const accountId = Number(req.params?.accountId);
            const { accountName, amount, status, iconId, colorId, position } = req.body;
            if (
                Utils.isEmpty(accountName) &&
                Utils.isNull(amount) &&
                Utils.isNull(status) &&
                Utils.isEmpty(iconId) &&
                Utils.isEmpty(colorId) &&
                Utils.isNull(position)
            ) {
                throw new ValidationError({ message: 'Path account failed due reason: empty body' });
            }
            await AccountOrchestrationServiceBuilder.build().patch(req.user?.userId as number, accountId, {
                accountName,
                amount,
                status,
                iconId,
                colorId,
                position,
            });
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            AccountController.logger.error(`Patch account failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.ACCOUNT_ERROR);
        }
    }
}
