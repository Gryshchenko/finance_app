import { Request, Response } from 'express';
import { ErrorCode, HttpCode, ResponseStatusType } from 'tenpercent/shared';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { IUser } from 'interfaces/IUser';
import EmailConfirmationServiceBuilder from 'services/emailConfirmation/EmailConfirmationServiceBuilder';
import { BaseError } from 'src/utils/errors/BaseError';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';

export class EmailConfirmationController {
    private static readonly logger = Logger.Of('EmailConfirmationController');

    public static async verify(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userFromSession = req.user as IUser;
            const { confirmationCode } = req.body;
            const userId = Number(req.user?.userId);
            const email = String(userFromSession?.email);
            await EmailConfirmationServiceBuilder.build().confirm(userId, email, Number(confirmationCode));
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).build());
        } catch (e: unknown) {
            EmailConfirmationController.logger.error(` failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.EMAIL_CONFIRMATION_ERROR);
        }
    }

    public static async resend(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userId = Number(req.user?.userId);
            const email = String(req.user?.email);
            await EmailConfirmationServiceBuilder.build().refresh(userId, email);
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).build());
        } catch (e: unknown) {
            EmailConfirmationController.logger.error(` failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.EMAIL_CONFIRMATION_ERROR);
        }
    }
}
