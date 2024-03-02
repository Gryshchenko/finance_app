import { NextFunction, Request, Response } from 'express';
import { ErrorCode } from 'types/ErrorCode';
import { TranslationsKeys } from 'src/utils/translationsKeys/TranslationsKeys';
import { RoleType } from 'types/RoleType';
import { ResponseStatusType } from 'types/ResponseStatusType';
import { IUser } from 'interfaces/IUser';

const dbConfig = require('../config/dbConfig');
const { body, validationResult } = require('express-validator');
const AuthUtils = require('../services/auth/AuthUtils');
const SessionUtils = require('../services/session/SessionUtils');
const UserServiceUtils = require('../services/user/UserServiceUtils');
const tokenVerify = require('../middleware/tokenVerify');
const ensureGuest = require('../middleware/ensureGuest');
const sessionVerify = require('../middleware/sessionVerify');
const ResponseBuilder = require('../helper/responseBuilder/ResponseBuilder');
const UserService = require('../services/user/UserService');
const DatabaseConnection = require('../repositories/DatabaseConnection');
const UserDataAccess = require('../services/user/UserDataAccess');
const Logger = require('../helper/logger/Logger');
const express = require('express');
const router = express.Router();

const validate = (validations: any[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        await Promise.all(validations.map((validation) => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        const responseBuilder = new ResponseBuilder().setStatus(ResponseStatusType.INTERNAL).setErrors(
            errors.array().map((err: { param: string; msg: string }) => ({
                errorCode: getErrorType(err.param),
                msg: err.msg,
            })),
        );

        res.status(400).json(responseBuilder.build());
    };
};

const getErrorType = (path: string) => {
    switch (path) {
        case 'email':
            return ErrorCode.EMAIL_INVALID;
        case 'password':
            return ErrorCode.PASSWORD_INVALID;
        case 'userName':
            return ErrorCode.USER_NAME_INVALID;
        default:
            return ErrorCode.UNKNOWN_ERROR;
    }
};

router.post(
    '/signup',
    ensureGuest,
    validate([body('password').isStrongPassword(), body('email').isEmail(), body('userName').isString()]),
    async (req: Request, res: Response) => {
        const _logger = Logger.Of('AuthRouteSignup');
        const responseBuilder = new ResponseBuilder();

        try {
            const dbConnection = new DatabaseConnection(dbConfig);
            const userDataAccess = new UserDataAccess(dbConnection);
            const userService = new UserService(userDataAccess);

            const user = await userService.getUserByEmail(req.body.email);
            if (user) {
                _logger.error('user already exists');
                return res
                    .status(400)
                    .json(
                        responseBuilder
                            .setStatus(ResponseStatusType.INTERNAL)
                            .setError({ errorCode: ErrorCode.EMAIL_ALREADY_EXIST, msg: TranslationsKeys.EMAIL_ALREADY_EXIST })
                            .build(),
                    );
            }

            const createdUser = await userService.createUser(req.body.email, req.body.password, req.body.userName);
            if (!createdUser) {
                throw new Error('Unable to store user');
            }

            const newToken = AuthUtils.createJWToken(createdUser.userId, RoleType.Default);
            handleSessionRegeneration(req, res, createdUser, newToken, _logger, responseBuilder);
        } catch (error) {
            _logger.error(error);
            res.status(400).json(
                responseBuilder
                    .setStatus(ResponseStatusType.INTERNAL)
                    .setError({ errorCode: ErrorCode.CANT_STORE_DATA, msg: TranslationsKeys.SOMETHING_WRONG })
                    .build(),
            );
        }
    },
);

const handleSessionRegeneration = (
    req: Request,
    res: Response,
    user: IUser,
    token: string,
    logger: typeof Logger,
    responseBuilder: typeof ResponseBuilder,
) => {
    req.session.regenerate((err) => {
        if (err) {
            logger.error('Session regeneration error: ' + err);
            res.status(400).json(
                responseBuilder
                    .setStatus(ResponseStatusType.INTERNAL)
                    .setError({ errorCode: ErrorCode.SESSION_CREATE_ERROR, msg: TranslationsKeys.SESSION_CREATE_ERROR })
                    .build(),
            );
            return;
        }

        SessionUtils.regenerateSession({
            err,
            user,
            token,
            req,
            handleError: (error: string) => {
                logger.error('Session regenerate error: ' + error);
                res.status(400).json(
                    responseBuilder
                        .setStatus(ResponseStatusType.INTERNAL)
                        .setError({ errorCode: ErrorCode.SESSION_CREATE_ERROR, msg: TranslationsKeys.SESSION_CREATE_ERROR })
                        .build(),
                );
            },
            handleSuccess: (sessionId: string) => {
                logger.info('Session regenerated successfully: ' + sessionId);
                res.setHeader('Authorization', `Bearer ${token}`);
                res.status(200).json(
                    responseBuilder
                        .setStatus(ResponseStatusType.OK)
                        .setData({ userId: user.userId, email: user.email, status: user.status })
                        .build(),
                );
            },
        });
    });
};

router.get('/logout', tokenVerify, sessionVerify, (req: Request, res: Response) => {
    const _logger = Logger.Of('AuthRouteLogout');
    const responseBuilder = new ResponseBuilder();
    req.session.destroy((err) => {
        if (err) {
            _logger.error('logout error: ' + err);
            res.status(400).json(
                responseBuilder
                    .setStatus(ResponseStatusType.INTERNAL)
                    .setError({
                        errorCode: ErrorCode.SESSION_DESTROY_ERROR,
                        msg: TranslationsKeys.SOMETHING_WRONG,
                    })
                    .build(),
            );
        }

        _logger.error('logout success');
        res.clearCookie(process.env.SS_NAME as string, { path: '/' });
        res.status(200).json(responseBuilder.setStatus(ResponseStatusType.OK).build());
    });
});

router.post(
    '/login',
    ensureGuest,
    [body('password').isString(), body('email').isString()],
    async (req: Request, res: Response) => {
        const responseBuilder = new ResponseBuilder();
        const errors = validationResult(req);
        const _logger = Logger.Of('AuthRouteLogin');
        if (!errors.isEmpty()) {
            return res.status(400).json(
                responseBuilder
                    .setStatus(ResponseStatusType.INTERNAL)
                    .setError({
                        errorCode: ErrorCode.CREDENTIALS_ERROR,
                        msg: TranslationsKeys.CREDENTIALS_ERROR,
                    })
                    .build(),
            );
        }

        try {
            const dbConnection = new DatabaseConnection(dbConfig);
            const userDataAccess = new UserDataAccess(dbConnection);
            const userService = new UserService(userDataAccess);
            _logger.info('request user data');
            const user = await userService.getUserByEmail(req.body.email);
            if (!user) {
                _logger.info('response user data: credential error');
                return res
                    .status(400)
                    .json(
                        responseBuilder
                            .setStatus(ResponseStatusType.INTERNAL)
                            .setError({ errorCode: ErrorCode.CREDENTIALS_ERROR, msg: TranslationsKeys.CREDENTIALS_ERROR })
                            .build(),
                    );
            }

            _logger.info('response user data userID: ' + user?.userId);
            const hashPassword = UserServiceUtils.hashPassword(req.body.password, user.salt);
            if (hashPassword !== user.passwordHash) {
                _logger.info('password not match');
                return res
                    .status(400)
                    .json(
                        responseBuilder
                            .setStatus(ResponseStatusType.INTERNAL)
                            .setError({ errorCode: ErrorCode.CREDENTIALS_ERROR, msg: TranslationsKeys.CREDENTIALS_ERROR })
                            .build(),
                    );
            }
            _logger.info('password good');
            const newToken = AuthUtils.createJWToken(user.userId, RoleType.Default);
            handleSessionRegeneration(req, res, user, newToken, _logger, responseBuilder);
        } catch (error) {
            _logger.error('request user data error: ' + error);
            return res
                .status(400)
                .json(
                    responseBuilder
                        .setStatus(ResponseStatusType.INTERNAL)
                        .setError({ errorCode: ErrorCode.CANT_STORE_DATA, msg: TranslationsKeys.SOMETHING_WRONG }),
                );
        }
    },
);
module.exports = router;
