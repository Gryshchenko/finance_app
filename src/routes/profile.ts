import express, { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { IUserSession } from 'interfaces/IUserSession';
import { ResponseStatusType } from 'types/ResponseStatusType';
import { ErrorCode } from 'types/ErrorCode';

import ResponseBuilder from 'src/helper/responseBuilder/ResponseBuilder';
import Success from 'src/utils/success/Success';
import Failure from 'src/utils/failure/Failure';
import UserRegistrationServiceBuilder from 'src/services/registration/UserRegistrationServiceBuilder';
import EmailConfirmationServiceBuilder from 'src/services/emailConfirmation/EmailConfirmationServiceBuilder';
import Logger from '../helper/logger/Logger';
import sessionVerify from '../middleware/sessionVerify';
import tokenVerify from '../middleware/tokenVerify';
import routesInputValidation from '../utils/validation/routesInputValidation';
import ProfileServiceBuilder from 'src/services/profile/ProfileServiceBuilder';
import ProfileServiceUtils from 'src/services/profile/ProfileServiceUtils';

const router = express.Router();

router.use(tokenVerify, sessionVerify);

router.get(
    '/:userId',
    routesInputValidation([param('userId').isNumeric().isInt({ min: 0, max: Number.MAX_SAFE_INTEGER })]),
    async (req: Request, res: Response) => {
        const _logger = Logger.Of('GetProfilePath');
        const responseBuilder = new ResponseBuilder();
        try {
            const userFromSession = req.session.user as IUserSession;
            if (parseInt(req.params.userId) !== userFromSession.userId) {
                throw new Error('Profile id not match');
            }
            const profileService = ProfileServiceBuilder.build();
            const response = await profileService.getProfile(userFromSession.userId);
            res.status(200).json(
                responseBuilder
                    .setStatus(ResponseStatusType.OK)
                    .setData(ProfileServiceUtils.convertServerUserToClientUser(response))
                    .build(),
            );
        } catch (error) {
            _logger.error(error);
            res.status(400).json(
                responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: ErrorCode.PROFILE_ERROR }).build(),
            );
        }
    },
);

router.post(
    '/confirm-email',
    routesInputValidation([body('code').isNumeric().isInt({ min: 0, max: 99999999 })]),
    async (req: Request, res: Response) => {
        const _logger = Logger.Of('PostConfirmationEmailPath');
        const responseBuilder = new ResponseBuilder();
        try {
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

router.post('/request-resend-confirmation', async (req: Request, res: Response) => {
    const _logger = Logger.Of('GetRequestResentConfirmation');
    const responseBuilder = new ResponseBuilder();
    try {
        const user = req.session.user as IUserSession;
        const emailService = EmailConfirmationServiceBuilder.build();
        const response = await emailService.sendConfirmationMailToUser(user.userId, user.email);
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
// router.post(
//     '/reset-password',
//     routesInputValidation([body('password').isStrongPassword(), body('newPassword').isStrongPassword()]),
//     (req: Request, res: Response) => {
//         const { token, newPassword } = req.body;
//         res.status(200).send('Password has been successfully reset.');
//     },
// );
// router.post(
//     '/request-mail-change',
//     routesInputValidation([body('email').isEmail()]),
//     async (req: Request, res: Response) => {
//         const _logger = Logger.Of('ProfileSendConfirmation');
//         const responseBuilder = new ResponseBuilder();
//         try {
//         } catch (error) {
//             _logger.error(error);
//             res.status(400).json(
//                 responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: ErrorCode.CANT_STORE_DATA }).build(),
//             );
//         }
//     },
// );
// router.post(
//     '/request-mail-confirmation',
//     routesInputValidation([body('email').isEmail(), body('code').isNumeric()]),
//     async (req: Request, res: Response) => {
//         const _logger = Logger.Of('ProfileSendConfirmation');
//         const responseBuilder = new ResponseBuilder();
//         try {
//         } catch (error) {
//             _logger.error(error);
//             res.status(400).json(
//                 responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: ErrorCode.CANT_STORE_DATA }).build(),
//             );
//         }
//     },
// );
export default router;
