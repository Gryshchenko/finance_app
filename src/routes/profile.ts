import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { IUserSession } from 'interfaces/IUserSession';
import { ResponseStatusType } from 'types/ResponseStatusType';
import { ErrorCode } from 'types/ErrorCode';

import ResponseBuilder from 'src/helper/responseBuilder/ResponseBuilder';
import Success from 'src/utils/success/Success';
import Failure from 'src/utils/failure/Failure';
import registerRouter from 'src/routes/register';
import UserRegistrationServiceBuilder from 'src/services/registration/UserRegistrationServiceBuilder';
import EmailConfirmationServiceBuilder from 'src/services/emailConfirmation/EmailConfirmationServiceBuilder';
import Logger from '../helper/logger/Logger';
import sessionVerify from '../middleware/sessionVerify';
import tokenVerify from '../middleware/tokenVerify';
import routesInputValidation from '../utils/validation/routesInputValidation';

const profileRouter = express.Router();

profileRouter.use(tokenVerify, sessionVerify);

profileRouter.post('/request-password-reset', routesInputValidation([body('email').isEmail()]), (req: Request, res: Response) => {
    const { email } = req.body;
    // res.status(200).send('If an account with that email exists, we have sent an email with a password reset link.');
});

registerRouter.post(
    '/confirm-email',
    tokenVerify,
    sessionVerify,
    routesInputValidation([body('code').isNumeric().isInt({ min: 0, max: 99999999 })]),
    async (req: Request, res: Response) => {
        const _logger = Logger.Of('RegistrationSendConfirmation');
        const responseBuilder = new ResponseBuilder();
        try {
            // @ts-ignore
            const userFromSession = req.session.user as IUserSession;
            const response = await UserRegistrationServiceBuilder.build().confirmUserMail(
                userFromSession.userId,
                Number(req.body.code),
            );
            if (response instanceof Success) {
                res.status(200).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(response.value).build());
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

profileRouter.get('/request-resend-confirmation', async (req: Request, res: Response) => {
    const _logger = Logger.Of('ProfileRequestResendConfirmation');
    const responseBuilder = new ResponseBuilder();
    try {
        // @ts-ignore
        const user = req.session.user as IUserSession;
        const emailService = EmailConfirmationServiceBuilder.build();
        const response = await emailService.sendConfirmationMail(user.userId, user.email);
        if (response instanceof Success) {
            res.status(200).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
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
});
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
            // const response = await emailService.confirmationUserMail(
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
