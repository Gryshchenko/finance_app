import express, { Request, Response } from 'express';
import { ErrorCode } from 'types/ErrorCode';
import { ResponseStatusType } from 'types/ResponseStatusType';
import Success from 'src/utils/success/Success';
import UserRegistrationServiceBuilder from 'src/services/registration/UserRegistrationServiceBuilder';
import Logger from 'src/helper/logger/Logger';
import ResponseBuilder from 'src/helper/responseBuilder/ResponseBuilder';
import Failure from 'src/utils/failure/Failure';
import UserServiceUtils from 'src/services/user/UserServiceUtils';
import signupValidationRules from 'src/utils/validation/signupValidationRules';
import ensureGuest from '../middleware/ensureGuest';
import SessionService from '../services/session/SessionService';
import routesInputValidation from '../utils/validation/routesInputValidation';

const registerRouter = express.Router();

registerRouter.post('/signup', ensureGuest, routesInputValidation(signupValidationRules), async (req: Request, res: Response) => {
    const _logger = Logger.Of('RegistrationSignup');
    const responseBuilder = new ResponseBuilder();

    try {
        const response = await UserRegistrationServiceBuilder.build().createUser(
            req.body.email,
            req.body.password,
            req.body.locale,
        );
        if (response instanceof Failure) {
            _logger.error(response.error);
            return res
                .status(400)
                .json(responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: response.code }).build());
        }

        if (response instanceof Success) {
            const { user, token } = response.value;
            SessionService.handleSessionRegeneration(req, res, user, token, _logger, responseBuilder, () => {
                res.status(200).json(
                    responseBuilder
                        .setStatus(ResponseStatusType.OK)
                        .setData(UserServiceUtils.convertServerUserToClientUser(user))
                        .build(),
                );
            });
        }
    } catch (error) {
        _logger.error(error);
        res.status(400).json(
            responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: ErrorCode.CANT_STORE_DATA }).build(),
        );
    }
});

export default registerRouter;
