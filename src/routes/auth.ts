import { NextFunction, Request, Response } from 'express';
import { ErrorCode } from 'types/ErrorCode';
import { TranslationsKeys } from 'src/utils/translationsKeys/TranslationsKeys';
import { RoleType } from 'types/RoleType';
import { ResponseStatusType } from 'types/ResponseStatusType';

const dbConfig = require('../config/dbConfig');
const { body, validationResult } = require('express-validator');
const AuthUtils = require('../services/auth/AuthUtils');
const SessionUtils = require('../services/session/SessionUtils');
const UserServiceUtils = require('../services/user/UserServiceUtils');
const authMiddleware = require('../middleware/authMiddleware');
const checkAuthentication = require('../middleware/checkAuthentication');
const ResponseBuilder = require('../helper/responseBuilder/ResponseBuilder');
const UserService = require('../services/user/UserService');
const DatabaseConnection = require('../repositories/DatabaseConnection');
const UserDataAccess = require('../services/user/UserDataAccess');
const express = require('express');
const router = express.Router();

router.use((req: Response, res: Response, next: NextFunction) => {
    next();
});

router.post(
    '/signup',
    checkAuthentication,
    [body('password').isString(), body('email').isEmail()],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        const responseBuilder = new ResponseBuilder();
        if (!errors.isEmpty()) {
            return res.status(400).json(
                responseBuilder
                    .setStatus(ResponseStatusType.INTERNAL)
                    .setErrors(
                        errors.array().map((data: { path: string; msg: string }) => {
                            return {
                                errorCode: data.path === 'email' ? ErrorCode.EMAIL_INVALID : ErrorCode.PASSWORD_INVALID,
                                msg: data.msg,
                            };
                        }),
                    )
                    .build(),
            );
        }
        try {
            const dbConnection = new DatabaseConnection(dbConfig);
            const userDataAccess = new UserDataAccess(dbConnection);
            const userService = new UserService(userDataAccess);
            const user = await userService.getUserByEmail(req.body.email);
            if (user) {
                return res
                    .status(400)
                    .json(
                        responseBuilder
                            .setStatus(ResponseStatusType.INTERNAL)
                            .setError({ errorCode: ErrorCode.EMAIL_ALREADY_EXIST, msg: TranslationsKeys.EMAIL_ALREADY_EXIST })
                            .build(),
                    );
            }
            const createdUser = await userService.createUser(req.body.email, req.body.password);
            req.session.regenerate((err) => {
                if (err) {
                    res.status(400).json(
                        responseBuilder
                            .setStatus(ResponseStatusType.INTERNAL)
                            .setError({
                                errorCode: ErrorCode.SESSION_CREATE_ERROR,
                                msg: TranslationsKeys.SESSION_CREATE_ERROR,
                            })
                            .build(),
                    );
                }
                const newToken = AuthUtils.createJWToken(createdUser.userId, RoleType.Default);
                // @ts-ignore
                req.session.user = SessionUtils.buildSessionObject(
                    createdUser,
                    newToken,
                    req.ip || req.connection.remoteAddress,
                    req.sessionID,
                );
                res.setHeader('Authorization', `Bearer ${newToken}`);
                return res.status(200).json(
                    responseBuilder
                        .setStatus(ResponseStatusType.OK)
                        .setData({
                            userId: createdUser.userId,
                            mail: createdUser.email,
                        })
                        .build(),
                );
            });
        } catch (e) {
            res.status(400).json(
                responseBuilder
                    .setStatus(ResponseStatusType.INTERNAL)
                    .setError({ errorCode: ErrorCode.CANT_STORE_DATA, msg: TranslationsKeys.SOMETHING_WRONG })
                    .build(),
            );
        }
    },
);

router.get('/logout', authMiddleware, (req: Request, res: Response) => {
    const responseBuilder = new ResponseBuilder();
    req.session.destroy((err) => {
        if (err) {
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
        res.clearCookie('session_id');
        res.status(200).json(responseBuilder.setStatus(ResponseStatusType.OK).build());
    });
});

router.post(
    '/login',
    checkAuthentication,
    [body('password').isString(), body('email').isString()],
    async (req: Request, res: Response) => {
        const responseBuilder = new ResponseBuilder();
        const errors = validationResult(req);
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
            const user = await userService.getUserByEmail(req.body.email);
            if (!user) {
                return res
                    .status(400)
                    .json(
                        responseBuilder
                            .setStatus(ResponseStatusType.INTERNAL)
                            .setError({ errorCode: ErrorCode.CREDENTIALS_ERROR, msg: TranslationsKeys.CREDENTIALS_ERROR })
                            .build(),
                    );
            }

            const hashPassword = UserServiceUtils.hashPassword(req.body.password, user.salt);
            if (hashPassword !== user.passwordHash) {
                return res
                    .status(400)
                    .json(
                        responseBuilder
                            .setStatus(ResponseStatusType.INTERNAL)
                            .setError({ errorCode: ErrorCode.CREDENTIALS_ERROR, msg: TranslationsKeys.CREDENTIALS_ERROR })
                            .build(),
                    );
            }

            req.session.regenerate((err) => {
                if (err) {
                    return res.status(400).json(
                        responseBuilder
                            .setStatus(ResponseStatusType.INTERNAL)
                            .setError({
                                errorCode: ErrorCode.SESSION_CREATE_ERROR,
                                msg: TranslationsKeys.SESSION_CREATE_ERROR,
                            })
                            .build(),
                    );
                }

                const newToken = AuthUtils.createJWToken(user.userId, RoleType.Default);
                // @ts-ignore
                req.session.user = SessionUtils.buildSessionObject(
                    user,
                    newToken,
                    req.ip || req.connection.remoteAddress,
                    req.sessionID,
                );
                res.setHeader('Authorization', `Bearer ${newToken}`);
                res.status(200).json(
                    responseBuilder
                        .setStatus(ResponseStatusType.OK)
                        .setData({
                            userId: user.userId,
                            mail: user.email,
                        })
                        .build(),
                );
            });
        } catch (error) {
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
