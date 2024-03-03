import { Request, Response, NextFunction } from 'express';
import { VerifyErrors } from 'jsonwebtoken';
import { ErrorCode } from 'types/ErrorCode';
import { TranslationsKeys } from 'src/utils/translationsKeys/TranslationsKeys';

require('dotenv').config();
const jwt = require('jsonwebtoken');
const _logger = require('../helper/logger/Logger').Of('TokenVerify');
const SessionUtils = require('../services/session/SessionUtils');

const extractToken = (req: Request) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    }
    return null;
};

const extractSessionToken = (req: Request) => {
    // @ts-ignore
    return req.session?.user.token;
};

const tokenVerify = (req: Request, res: Response, next: NextFunction) => {
    const token = extractToken(req);
    const sessionToken = extractSessionToken(req);
    if (!token) {
        _logger.info('token not verify, token = null');
        SessionUtils.deleteSession(req, res, () => {
            res.status(401).json({ errorCode: ErrorCode.AUTH, msg: TranslationsKeys.INVALID_TOKEN });
        });
        return;
    }
    if (token !== sessionToken) {
        _logger.info('token not verify, token and session token not same');
        SessionUtils.deleteSession(req, res, () => {
            res.status(401).json({ errorCode: ErrorCode.AUTH, msg: TranslationsKeys.INVALID_TOKEN });
        });
        return;
    }
    jwt.verify(token, process.env.JWT_SECRET, (err: VerifyErrors & { complete: boolean }) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                SessionUtils.deleteSession(req, res, () => {
                    res.status(401).json({ errorCode: ErrorCode.AUTH, msg: TranslationsKeys.TOKEN_EXPIRED });
                });
                _logger.info('token not verify, token expired');
            } else {
                SessionUtils.deleteSession(req, res, () => {
                    res.status(401).json({ errorCode: ErrorCode.AUTH, msg: TranslationsKeys.INVALID_TOKEN });
                });
                _logger.info('token not verify, token invalid');
            }
        } else {
            _logger.info('token verify success');
            next();
        }
    });
};

module.exports = tokenVerify;
