import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { IUserSession } from 'interfaces/IUserSession';
import { ResponseStatusType } from 'types/ResponseStatusType';
import { ErrorCode } from 'types/ErrorCode';

namespace Profile {
    const express = require('express');
    const SessionService = require('../services/session/SessionService');
    const routesInputValidation = require('../utils/validation/routesInputValidation');
    const { body, validationResult } = require('express-validator');
    const tokenVerify = require('../middleware/tokenVerify');
    const sessionVerify = require('../middleware/sessionVerify');
    const ResponseBuilder = require('../helper/responseBuilder/ResponseBuilder');
    const EmailConfirmationServiceBuilder = require('../services/emailConfirmation/EmailConfirmationServiceBuilder');
    const Logger = require('../helper/logger/Logger');
    const Success = require('../utils/success/Success');
    const Failure = require('../utils/failure/Failure');
    const router = express.Router();

    router.use(tokenVerify, sessionVerify);

    router.post('/request-password-reset', routesInputValidation([body('email').isEmail()]), (req: Request, res: Response) => {
        const { email } = req.body;
        // res.status(200).send('If an account with that email exists, we have sent an email with a password reset link.');
    });
    router.post(
        '/request-resend-confirmation',
        routesInputValidation([body('email').isEmail()]),
        async (req: Request, res: Response) => {
            const _logger = Logger.Of('ProfileRequestResendConfirmation');
            const responseBuilder = new ResponseBuilder();
            try {
                // @ts-ignore
                const user = req.session.user as IUserSession;
                const emailService = EmailConfirmationServiceBuilder.build();
                const response = await emailService.sendAgainConfirmationMail(user.userId, req.body.email);
                if (typeof response === Success) {
                    res.status(200).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
                } else {
                    _logger.error(response.error);
                    return res
                        .status(400)
                        .json(
                            responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: response.code }).build(),
                        );
                }
            } catch (error) {
                _logger.error(error);
                res.status(400).json(
                    responseBuilder
                        .setStatus(ResponseStatusType.INTERNAL)
                        .setError({ errorCode: ErrorCode.CANT_STORE_DATA })
                        .build(),
                );
            }
        },
    );
    router.post(
        '/reset-password',
        routesInputValidation([body('password').isStrongPassword(), body('newPassword').isStrongPassword()]),
        (req: Request, res: Response) => {
            const { token, newPassword } = req.body;
            res.status(200).send('Password has been successfully reset.');
        },
    );
    router.post('/request-mail-change', routesInputValidation([body('email').isEmail()]), async (req: Request, res: Response) => {
        const _logger = Logger.Of('ProfileSendConfirmation');
        const responseBuilder = new ResponseBuilder();
        try {
            // if (typeof response === Success) {
            //         SessionService.deleteSession(req, res, () => {
            //             res.status(200).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
            //         });
            // } else {
            //     _logger.error(response.error);
            //     return res
            //         .status(400)
            //         .json(
            //             responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: response.code }).build(),
            //         );
            // }
        } catch (error) {
            _logger.error(error);
            res.status(400).json(
                responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: ErrorCode.CANT_STORE_DATA }).build(),
            );
        }
    });
    router.post(
        '/request-mail-confirmation',
        routesInputValidation([body('email').isEmail(), body('code').isNumeric()]),
        async (req: Request, res: Response) => {
            const _logger = Logger.Of('ProfileSendConfirmation');
            const responseBuilder = new ResponseBuilder();
            try {
                // const emailService = EmailConfirmationServiceBuilder.build();
                // // @ts-ignore
                // const user = req.session.user as IUserSession;
                // const response = await emailService.proceedMailConfirmationCode(
                //     user.userId,
                //     req.body.email,
                //     req.body.code,
                //     user.email,
                // );
                // if (typeof response === Success) {
                //     SessionService.deleteSession(req, res, () => {
                //         res.status(200).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
                //     });
                // } else {
                //     _logger.error(response.error);
                //     return res
                //         .status(400)
                //         .json(
                //             responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: response.code }).build(),
                //         );
                // }
            } catch (error) {
                _logger.error(error);
                res.status(400).json(
                    responseBuilder
                        .setStatus(ResponseStatusType.INTERNAL)
                        .setError({ errorCode: ErrorCode.CANT_STORE_DATA })
                        .build(),
                );
            }
        },
    );
    module.exports = router;
}
