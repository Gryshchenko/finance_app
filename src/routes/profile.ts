/* eslint-disable @typescript-eslint/no-unused-vars */
import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { IUserSession } from 'interfaces/IUserSession';
import { ResponseStatusType } from 'types/ResponseStatusType';
import { ErrorCode } from 'types/ErrorCode';

import SessionService from '../services/session/SessionService';

import routesInputValidation from '../utils/validation/routesInputValidation';
import tokenVerify from '../middleware/tokenVerify';
import sessionVerify from '../middleware/sessionVerify';
import ResponseBuilder from 'src/helper/responseBuilder/ResponseBuilder';
import UserRegistrationServiceBuilder from 'src/services/emailConfirmation/EmailConfirmationServiceBuilder';
import Logger from '../helper/logger/Logger';
import Success from 'src/utils/success/Success';
const profileRouter = express.Router();

profileRouter.use(tokenVerify, sessionVerify);

profileRouter.post('/request-password-reset', routesInputValidation([body('email').isEmail()]), (req: Request, res: Response) => {
    const { email } = req.body;
    // res.status(200).send('If an account with that email exists, we have sent an email with a password reset link.');
});
profileRouter.post(
    '/request-resend-confirmation',
    routesInputValidation([body('email').isEmail()]),
    async (req: Request, res: Response) => {
        const _logger = Logger.Of('ProfileRequestResendConfirmation');
        const responseBuilder = new ResponseBuilder();
        try {
            // @ts-ignore
            const user = req.session.user as IUserSession;
            const emailService = UserRegistrationServiceBuilder.build();
            const response = await emailService.sendAgainConfirmationMail(user.userId, req.body.email);
            // if (response instanceof  Success) {
            //     res.status(200).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
            // } else {
            //     _logger.error(response.error);
            //     return res
            //         .status(400)
            //         .json(responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: response.code }).build());
            // }
        } catch (error) {
            _logger.error(error);
            res.status(400).json(
                responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: ErrorCode.CANT_STORE_DATA }).build(),
            );
        }
    },
);
profileRouter.post(
    '/reset-password',
    routesInputValidation([body('password').isStrongPassword(), body('newPassword').isStrongPassword()]),
    (req: Request, res: Response) => {
        const { token, newPassword } = req.body;
        res.status(200).send('Password has been successfully reset.');
    },
);
profileRouter.post(
    '/request-mail-change',
    routesInputValidation([body('email').isEmail()]),
    async (req: Request, res: Response) => {
        const _logger = Logger.Of('ProfileSendConfirmation');
        const responseBuilder = new ResponseBuilder();
        try {
            // if (response instanceof  Success) {
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
    },
);
profileRouter.post(
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
            // if (response instanceof  Success) {
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
                responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: ErrorCode.CANT_STORE_DATA }).build(),
            );
        }
    },
);
export default profileRouter;
