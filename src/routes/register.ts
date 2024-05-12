import express, { Request, Response } from 'express';
import { ErrorCode } from 'types/ErrorCode';
import { ResponseStatusType } from 'types/ResponseStatusType';
import { IUserSession } from 'interfaces/IUserSession';

const { body } = require('express-validator');
import routesInputValidation from '../utils/validation/routesInputValidation';
import SessionService from '../services/session/SessionService';
import tokenVerify from '../middleware/tokenVerify';
import ensureGuest from '../middleware/ensureGuest';
import sessionVerify from '../middleware/sessionVerify';
import Success from 'src/utils/success/Success';
import UserRegistrationServiceBuilder from 'src/services/registration/UserRegistrationServiceBuilder';
import Logger from 'src/helper/logger/Logger';
import ResponseBuilder from 'src/helper/responseBuilder/ResponseBuilder';
import Failure from 'src/utils/failure/Failure';

const registerRouter = express.Router();

registerRouter.post(
    '/confirm-email',
    tokenVerify,
    sessionVerify,
    routesInputValidation([body('email').isEmail().isLength({ max: 50 }), body('code').isNumeric().isLength({ max: 50 })]),
    async (req: Request, res: Response) => {
        const _logger = Logger.Of('RegistrationSendConfirmation');
        const responseBuilder = new ResponseBuilder();
        try {
            // @ts-ignore
            const userFromSession = req.session.user as IUserSession;
            if (userFromSession.email !== req.body.email) {
                _logger.error('email from session and user input email not same');
                res.status(400).json(
                    responseBuilder
                        .setStatus(ResponseStatusType.INTERNAL)
                        .setError({ errorCode: ErrorCode.EMAIL_INVALID })
                        .build(),
                );
            }
            const response = await UserRegistrationServiceBuilder.build().confirmUserMail(
                userFromSession.userId,
                req.body.email,
                req.body.code,
            );
            if (response instanceof Success) {
                res.status(200).json(
                    responseBuilder
                        .setStatus(ResponseStatusType.OK)
                        .setData({
                            email: req.body.email,
                        })
                        .build(),
                );
            } else {
                _logger.error((response as Failure).error);
                return res.status(400).json(
                    responseBuilder
                        .setStatus(ResponseStatusType.INTERNAL)
                        .setError({ errorCode: (response as Failure).code })
                        .build(),
                );
            }
        } catch (error) {
            _logger.error(error);
            res.status(400).json(
                responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: ErrorCode.CANT_STORE_DATA }).build(),
            );
        }
    },
);

registerRouter.post(
    '/signup',
    ensureGuest,
    routesInputValidation([
        body('password').isStrongPassword().isLength({ max: 50 }),
        body('email').isEmail().isLength({ max: 50 }),
        body('locale').optional(true).isString().isLength({ max: 50 }),
    ]),
    async (req: Request, res: Response) => {
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
                            .setData({ email: user.email, status: user.status })
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
    },
);

export default registerRouter;
