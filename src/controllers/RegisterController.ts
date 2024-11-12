import { Request, Response } from 'express';
import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import UserRegistrationServiceBuilder from 'services/registration/UserRegistrationServiceBuilder';
import Failure from 'src/utils/failure/Failure';
import { ResponseStatusType } from 'types/ResponseStatusType';
import Success from 'src/utils/success/Success';
import SessionService from 'services/session/SessionService';
import UserServiceUtils from 'services/user/UserServiceUtils';
import { ErrorCode } from 'types/ErrorCode';
import { HttpCode } from 'types/HttpCode';
export class RegisterController {
    private static logger = Logger.Of('RegisterController');
    public static async signup(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();

        try {
            const response = await UserRegistrationServiceBuilder.build().createUser(
                req.body.email,
                req.body.password,
                req.body.locale,
            );
            if (response instanceof Failure) {
                RegisterController.logger.error(response.error);
                return res
                    .status(401)
                    .json(responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: response.code }).build());
            }

            if (response instanceof Success) {
                const { user, token } = response.value;
                SessionService.handleSessionRegeneration(
                    req,
                    res,
                    user,
                    token,
                    RegisterController.logger,
                    responseBuilder,
                    () => {
                        res.status(HttpCode.OK).json(
                            responseBuilder
                                .setStatus(ResponseStatusType.OK)
                                .setData(UserServiceUtils.convertServerUserToClientUser(user))
                                .build(),
                        );
                    },
                );
            }
        } catch (error) {
            RegisterController.logger.error(error);
            res.status(HttpCode.INTERNAL_SERVER_ERROR).json(
                responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: ErrorCode.CANT_STORE_DATA }).build(),
            );
        }
    }
}
