import { Request, Response, NextFunction } from 'express';
import { VerifyErrors } from 'jsonwebtoken';
import { ErrorCode } from 'types/ErrorCode';
import Logger from 'src/helper/logger/Logger';
import SessionService from '../services/session/SessionService';
import { getConfig } from 'src/config/config';

const jwt = require('jsonwebtoken');

const _logger = Logger.Of('TokenVerify');

const extractToken = (req: Request) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    }
    return null;
};

const extractSessionToken = (req: Request) => {
    return req.session?.user?.token;
};
const tokenVerify = (req: Request, res: Response, next: NextFunction) => {
    const token = extractToken(req);
    const sessionToken = extractSessionToken(req);
    if (!token) {
        _logger.info('token not verify, token = null');
        SessionService.deleteSession(req, res, () => {
            res.status(401).json({ errorCode: ErrorCode.AUTH });
        });
        return;
    }
    if (token !== sessionToken) {
        _logger.info('token not verify, token and session token not same');
        SessionService.deleteSession(req, res, () => {
            res.status(401).json({ errorCode: ErrorCode.AUTH });
        });
        return;
    }
    jwt.verify(token, getConfig().jwtSecret ?? null, (err: VerifyErrors & { complete: boolean }) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                SessionService.deleteSession(req, res, () => {
                    res.status(401).json({ errorCode: ErrorCode.AUTH });
                });
                _logger.info('token not verify, token expired');
            } else {
                SessionService.deleteSession(req, res, () => {
                    res.status(401).json({ errorCode: ErrorCode.AUTH });
                });
                _logger.info('token not verify, token invalid');
            }
        } else {
            _logger.info('token verify success');
            next();
        }
    });
};

export default tokenVerify;
