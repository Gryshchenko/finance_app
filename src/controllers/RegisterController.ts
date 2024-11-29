import { Request, Response } from 'express';
import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import UserRegistrationServiceBuilder from 'services/registration/UserRegistrationServiceBuilder';
import { ResponseStatusType } from 'types/ResponseStatusType';
import SessionService from 'services/session/SessionService';
import UserServiceUtils from 'services/user/UserServiceUtils';
import { ErrorCode } from 'types/ErrorCode';
import { HttpCode } from 'types/HttpCode';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';
import { BaseError } from 'src/utils/errors/BaseError';
export class RegisterController {
    private static readonly logger = Logger.Of('RegisterController');
    public static async signup(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();

        try {
            const response = await UserRegistrationServiceBuilder.build().createUser(
                req.body.email,
                req.body.password,
                req.body.locale,
            );
            const { user, token } = response;
            SessionService.handleSessionRegeneration(req, res, user, token, RegisterController.logger, responseBuilder, () => {
                res.status(HttpCode.OK).json(
                    responseBuilder
                        .setStatus(ResponseStatusType.OK)
                        .setData(UserServiceUtils.convertServerUserToClientUser(user))
                        .build(),
                );
            });
        } catch (e: unknown) {
            RegisterController.logger.error(`Signup failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.SIGNUP_CATCH_ERROR);
        }
    }
}
