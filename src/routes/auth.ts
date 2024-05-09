import express, { Request, Response } from 'express';
import { ErrorCode } from 'types/ErrorCode';
import { ResponseStatusType } from 'types/ResponseStatusType';
import { TranslationKey } from 'types/TranslationKey';

import { body, validationResult } from 'express-validator';
import routesInputValidation from '../utils/validation/routesInputValidation';
import SessionService from '../services/session/SessionService';
import tokenVerify from '../middleware/tokenVerify';
import ensureGuest from '../middleware/ensureGuest';
import sessionVerify from '../middleware/sessionVerify';
import ResponseBuilder from 'src/helper/responseBuilder/ResponseBuilder';
import AuthServiceBuilder from 'src/services/auth/AuthServiceBuilder';
import Logger from '../helper/logger/Logger';
import Success from 'src/utils/success/Success';
import Failure from 'src/utils/failure/Failure';
import { IFailure } from 'interfaces/IFailure';
import { IUser } from 'interfaces/IUser';
import { ISuccess } from 'interfaces/ISuccess';
const authRouter = express.Router();

authRouter.get('/logout', tokenVerify, sessionVerify, (req: Request, res: Response) => {
    const responseBuilder = new ResponseBuilder();
    SessionService.deleteSession(req, res, () => {
        res.status(200).json(responseBuilder.setStatus(ResponseStatusType.OK).build());
    });
});

authRouter.post(
    '/login',
    ensureGuest,
    routesInputValidation([body('password').isString().isLength({ max: 50 }), body('email').isString().isLength({ max: 50 })]),
    async (req: Request, res: Response) => {
        const responseBuilder = new ResponseBuilder();
        const _logger: Logger = Logger.Of('AuthRouteLogin');
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new Error('validation error');
            }
            // ***** Need to check types ****
            // const response = await AuthServiceBuilder.build().login(req.body.email, req.body.password);
            // if (response instanceof  Success) {
            //     const { user, token } = response.value;
            //     SessionService.handleSessionRegeneration(req, res, user, token, _logger, responseBuilder, () => {
            //         res.status(200).json(
            //             responseBuilder
            //                 .setStatus(ResponseStatusType.OK)
            //                 .setData({ email: user.email, status: user.status })
            //                 .build(),
            //         );
            //     });
            // } else if (response instanceof  typeof Failure) {
            //     throw new Error(response.error);
            // }
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

export default authRouter;
