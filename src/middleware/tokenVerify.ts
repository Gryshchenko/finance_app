import { Request, Response, NextFunction } from 'express';
import { VerifyErrors } from 'jsonwebtoken';
import { ErrorCode } from 'types/ErrorCode';
import { TranslationsKeys } from 'src/utils/translationsKeys/TranslationsKeys';

const jwt = require('jsonwebtoken');
const _logger = require('../helper/logger/Logger').Of('TokenVerify');
require('dotenv').config();

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
        return res.status(401).json({ errorCode: ErrorCode.AUTH, msg: TranslationsKeys.INVALID_TOKEN });
    }
    if (token !== sessionToken) {
        _logger.info('token not verify, token and session token not same');
        return res.status(401).json({ errorCode: ErrorCode.AUTH, msg: TranslationsKeys.INVALID_TOKEN });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err: VerifyErrors & { complete: boolean }) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                _logger.info('token not verify, token expired');
                res.status(401).json({ errorCode: ErrorCode.AUTH, msg: TranslationsKeys.TOKEN_EXPIRED });
            } else {
                _logger.info('token not verify, token invalid');
                res.status(401).json({ errorCode: ErrorCode.AUTH, msg: TranslationsKeys.INVALID_TOKEN });
            }
        } else {
            _logger.info('token verify success');
            next();
        }
    });
};

module.exports = tokenVerify;
