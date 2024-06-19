import { Request, Response } from 'express';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import Logger from 'helper/logger/Logger';
import { validationResult } from 'express-validator';
import AuthServiceBuilder from 'services/auth/AuthServiceBuilder';
import Success from 'src/utils/success/Success';
import SessionService from 'services/session/SessionService';
import { ResponseStatusType } from 'types/ResponseStatusType';
import UserServiceUtils from 'services/user/UserServiceUtils';
import Failure from 'src/utils/failure/Failure';
import { ErrorCode } from 'types/ErrorCode';

export class AuthController {
    private static logger = Logger.Of('AuthController');
    public static async logout(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        SessionService.deleteSession(req, res, () => {
            res.status(200).json(responseBuilder.setStatus(ResponseStatusType.OK).build());
        });
    }
    public static async login(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new Error('validation error');
            }
            const response = await AuthServiceBuilder.build().login(req.body.email, req.body.password);
            if (response instanceof Success) {
                const { user, token } = response.value;
                SessionService.handleSessionRegeneration(req, res, user, token, AuthController.logger, responseBuilder, () => {
                    res.status(200).json(
                        responseBuilder
                            .setStatus(ResponseStatusType.OK)
                            .setData(UserServiceUtils.convertServerUserToClientUser(user))
                            .build(),
                    );
                });
            } else if (response instanceof Failure) {
                throw new Error(response.error);
            }
        } catch (error) {
            AuthController.logger.error(`request user data error: ${error}`);
            return res
                .status(400)
                .json(responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: ErrorCode.CANT_STORE_DATA }));
        }
    }
}
