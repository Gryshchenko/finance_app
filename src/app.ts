import { Request, Response } from 'express';
import { ErrorCode } from './types/ErrorCode';
import { ResponseType } from './types/ResponseType';
import { IUser } from 'interfaces/IUser';
import { TranslationsKeys } from './translationsKeys/TranslationsKeys';
import { PermissionType } from 'src/types/PermissionType';

const passport = require('passport');
const jwt = require('jsonwebtoken');
const express = require('express');
const helmet = require('helmet');
const passportSetup = require('./services/auth/passport-setup');
const sessionSetup = require('./services/session/session-setup');
const { body, validationResult } = require('express-validator');
const Utils = require('./utils/Utils');
const AuthUtils = require('./services/auth/AuthUtils');
const SessionUtils = require('./services/session/SessionUtils');

require('dotenv').config();

const DatabaseConnection = require('./db/DatabaseConnection');
const UserService = require('./services/user/UserService');
const UserDataAccess = require('./services/user/UserDataAccess');

const app = express();
const port = process.env.PORT || 3000;

const dbConnection = new DatabaseConnection({
    database: null,
    port: Number(process.env.DB_PORT),
    password: process.env.DB_PASS,
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
});
const userDataAccess = new UserDataAccess(dbConnection);
const userService = new UserService(userDataAccess);

passportSetup(passport);

app.use(express.json());
app.use(helmet());
app.use(passport.initialize());
app.use(sessionSetup());

app.get('/', (req: any, res: any) => {
    res.send('Hello World!');
});

app.post('/signup', [body('password').isString(), body('email').isEmail()], (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            type: ResponseType.REGISTRATION,
            errors: errors.array().map((data: { path: string; msg: string }) => {
                return {
                    errorCode: data.path === 'email' ? ErrorCode.EMAIL_INVALID : ErrorCode.PASSWORD_INVALID,
                    msg: data.msg,
                };
            }),
        });
    } else {
        userService
            .getUserByEmail(req.body.email)
            .then((user: Partial<IUser>) => {
                if (Utils.isNull(user)) {
                    userService
                        .createUser(req.body.email, req.body.password)
                        .then((user: IUser) => {
                            req.session.regenerate((err) => {
                                if (err) {
                                    res.status(400).json({
                                        type: ResponseType.REGISTRATION,
                                        msg: TranslationsKeys.SESSION_CREATE_ERROR,
                                    });
                                }
                                req.session.user = SessionUtils.buildSessionObject(
                                    user,
                                    AuthUtils.createJWToken(user.userId),
                                    req.ip || req.connection.remoteAddress,
                                    req.sessionID,
                                );
                            });

                            res.status(200).json({
                                type: ResponseType.REGISTRATION,
                                msg: TranslationsKeys.DATA_STORED,
                            });
                        })
                        .catch(() => {
                            res.status(400).json({
                                type: ResponseType.REGISTRATION,
                                errors: [{ errorCode: ErrorCode.CANT_STORE_DATA, msg: TranslationsKeys.SOMETHING_WRONG }],
                            });
                        });
                } else {
                    res.status(400).json({
                        type: ResponseType.REGISTRATION,
                        errors: [{ errorCode: ErrorCode.EMAIL_ALREADY_EXIST, msg: TranslationsKeys.EMAIL_ALREADY_EXIST }],
                    });
                }
            })
            .catch(() => {
                res.status(400).json({
                    type: ResponseType.REGISTRATION,
                    errors: [{ errorCode: ErrorCode.CANT_STORE_DATA, msg: TranslationsKeys.SOMETHING_WRONG }],
                });
            });
    }
});

app.get('/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(400).json({
                type: ResponseType.LOGIN,
                msg: TranslationsKeys.SESSION_CREATE_ERROR,
            });
        }
        res.clearCookie('session_id');
    });
});

app.get('/protected', passport.authenticate('jwt', { session: false }), (req: Request, res: Response) => {
    // res.json({ message: 'Вы успешно доступились к защищенному маршруту!' });
});

app.post('/login', (req: any, res: any) => {
    console.log(req.session);

    const user = { id: 'test', username: 'example' };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log(token);

    res.json({ token });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
