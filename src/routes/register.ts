import { Request, Response } from 'express';
import { ErrorCode } from 'types/ErrorCode';
import { ResponseStatusType } from 'types/ResponseStatusType';
import { IUserSession } from 'interfaces/IUserSession';

const { body } = require('express-validator');
const routesInputValidation = require('../utils/validation/routesInputValidation');
const SessionService = require('../services/session/SessionService');
const ensureGuest = require('../middleware/ensureGuest');
const ResponseBuilder = require('../helper/responseBuilder/ResponseBuilder');
const UserRegistrationServiceBuilder = require('../services/registration/UserRegistrationServiceBuilder');
const Logger = require('../helper/logger/Logger');
const express = require('express');
const Success = require('../utils/success/Success');
const Failure = require('../utils/failure/Failure');

const tokenVerify = require('../middleware/tokenVerify');
const sessionVerify = require('../middleware/sessionVerify');
const router = express.Router();

router.post(
    '/confirm-email',
    tokenVerify,
    sessionVerify,
    routesInputValidation([body('email').isEmail(), body('code').isNumeric()]),
    async (req: Request, res: Response) => {
        const _logger = Logger.Of('ProfileSendConfirmation');
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
            if (typeof response === Success) {
                res.status(200).json(
                    responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build({
                        email: req.body.email,
                    }),
                );
            } else {
                _logger.error(response.error);
                return res
                    .status(400)
                    .json(responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: response.code }).build());
            }
        } catch (error) {
            _logger.error(error);
            res.status(400).json(
                responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: ErrorCode.CANT_STORE_DATA }).build(),
            );
        }
    },
);

router.post(
    '/signup',
    ensureGuest,
    routesInputValidation([body('password').isStrongPassword(), body('email').isEmail()]),
    async (req: Request, res: Response) => {
        const _logger = Logger.Of('AuthRouteSignup');
        const responseBuilder = new ResponseBuilder();

        try {
            const response = await UserRegistrationServiceBuilder.build().createUser(req.body.email, req.body.password);
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
