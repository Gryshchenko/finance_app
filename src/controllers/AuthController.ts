import { Request, Response } from 'express';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import Logger from 'helper/logger/Logger';
import { validationResult } from 'express-validator';
import AuthServiceBuilder from 'services/auth/AuthServiceBuilder';
import SessionService from 'services/session/SessionService';
import { ResponseStatusType } from 'types/ResponseStatusType';
import UserServiceUtils from 'services/user/UserServiceUtils';
import { ErrorCode } from 'types/ErrorCode';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { HttpCode } from 'types/HttpCode';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';
import { BaseError } from 'src/utils/errors/BaseError';

export class AuthController {
    private static readonly logger = Logger.Of('AuthController');
    public static async logout(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        SessionService.deleteSession(req, res, () => {
            res.status(201).json(responseBuilder.setStatus(ResponseStatusType.OK).build());
        });
    }
    public static async login(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new ValidationError({ message: 'login validation error' });
            }
            const { user, token } = await AuthServiceBuilder.build().login(req.body.email, req.body.password);
            SessionService.handleSessionRegeneration(req, res, user, token, AuthController.logger, responseBuilder, () => {
                res.status(HttpCode.OK).json(
                    responseBuilder
                        .setStatus(ResponseStatusType.OK)
                        .setData(UserServiceUtils.convertServerUserToClientUser(user))
                        .build(),
                );
            });
        } catch (e: unknown) {
            AuthController.logger.error(`Use login failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.AUTH);
        }
    }
}
