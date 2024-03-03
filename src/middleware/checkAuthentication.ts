import { Request, Response, NextFunction } from 'express';
import { VerifyErrors } from 'jsonwebtoken';
import { ErrorCode } from 'types/ErrorCode';
import { TranslationsKeys } from 'src/utils/translationsKeys/TranslationsKeys';
const SessionUtils = require('../services/session/SessionUtils');

const jwt = require('jsonwebtoken');
require('dotenv').config();

const checkAuthentication = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err: VerifyErrors) => {
            if (err) {
                next();
            } else {
                SessionUtils.deleteSession(req, res, () => {
                    res.status(401).json({ errorCode: ErrorCode.AUTH, msg: TranslationsKeys.TOKEN_EXPIRED });
                });
            }
        });
    } else {
        next();
    }
};

module.exports = checkAuthentication;
