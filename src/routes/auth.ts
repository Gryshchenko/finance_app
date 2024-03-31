import { Request, Response } from 'express';
import { ErrorCode } from 'types/ErrorCode';
import { ResponseStatusType } from 'types/ResponseStatusType';
import { TranslationKey } from 'types/TranslationKey';

const { body, validationResult } = require('express-validator');
const routesInputValidation = require('../utils/validation/routesInputValidation');
const SessionService = require('../services/session/SessionService');
const tokenVerify = require('../middleware/tokenVerify');
const ensureGuest = require('../middleware/ensureGuest');
const sessionVerify = require('../middleware/sessionVerify');
const ResponseBuilder = require('../helper/responseBuilder/ResponseBuilder');
const AuthServiceBuilder = require('../services/auth/AuthServiceBuilder');
const Logger = require('../helper/logger/Logger');
const express = require('express');
const Success = require('../utils/success/Success');
const Failure = require('../utils/failure/Failure');
const router = express.Router();

router.get('/logout', tokenVerify, sessionVerify, (req: Request, res: Response) => {
    const responseBuilder = new ResponseBuilder();
    SessionService.deleteSession(req, res, () => {
        res.status(200).json(responseBuilder.setStatus(ResponseStatusType.OK).build());
    });
});

router.post(
    '/login',
    ensureGuest,
    routesInputValidation([body('password').isString(), body('email').isString()]),
    async (req: Request, res: Response) => {
        const responseBuilder = new ResponseBuilder();
        const _logger = Logger.Of('AuthRouteLogin');
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new Error('validation error');
            }

            const response = await AuthServiceBuilder.build().login(req.body.email, req.body.password);
            if (typeof response === Success) {
                const { user, token } = response.value;
                SessionService.handleSessionRegeneration(req, res, user, token, _logger, responseBuilder, () => {
                    res.status(200).json(
                        responseBuilder
                            .setStatus(ResponseStatusType.OK)
                            .setData({ email: user.email, status: user.status })
                            .build(),
                    );
                });
            } else if (typeof response === Failure) {
                throw new Error(response.error);
            }
        } catch (error) {
            _logger.error('request user data error: ' + error);
            return res
                .status(400)
                .json(
                    responseBuilder
                        .setStatus(ResponseStatusType.INTERNAL)
                        .setError({ errorCode: ErrorCode.CANT_STORE_DATA, msg: TranslationKey.SOMETHING_WRONG }),
                );
        }
    },
);
module.exports = router;
