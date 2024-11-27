import { Request, Response, NextFunction } from 'express';
import { VerifyErrors } from 'jsonwebtoken';
import Logger from 'src/helper/logger/Logger';
import SessionService from '../services/session/SessionService';
import { getConfig } from 'src/config/config';
import { ResponseBuilderPreset } from 'helper/responseBuilder/ResponseBuilderPreset';
const crypto = require('crypto');

const jwt = require('jsonwebtoken');

const _logger = Logger.Of('TokenVerify');

const errorHandler = (errorMsg: string, code: number, req: Request, res: Response) => {
    _logger.info(errorMsg);
    res.status(code).json(ResponseBuilderPreset.getAuthError());
};

const tokenVerifyHandler = (req: Request, res: Response, next: NextFunction, errorHandler: (errorMsg: string) => void) => {
    const token = extractToken(req);
    const userSession = SessionService.extractSessionFromRequest(req);

    if (!token) {
        errorHandler('Token verification failed: token is null');
        return;
    }

    if (!userSession?.token) {
        errorHandler('Token verification failed: session token is null');
        return;
    }

    const tokenBuffer = Buffer.from(token, 'utf-8');
    const sessionTokenBuffer = Buffer.from(userSession.token, 'utf-8');

    // Use timingSafeEqual to compare tokens safely
    if (tokenBuffer.length !== sessionTokenBuffer.length || !crypto.timingSafeEqual(tokenBuffer, sessionTokenBuffer)) {
        errorHandler('Token verification failed: token and session token do not match');
        return;
    }

    jwt.verify(token, getConfig().jwtSecret ?? null, (err: VerifyErrors & { complete: boolean }) => {
        if (err) {
            const errorType = err.name === 'TokenExpiredError' ? 'expired' : 'invalid';
            errorHandler(`Token verification failed: token is ${errorType}`);
        } else {
            _logger.info('Token verified successfully');
            next();
        }
    });
};

const extractToken = (req: Request) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    }
    return null;
};

export const tokenVerifyLogout = (req: Request, res: Response, next: NextFunction) => {
    tokenVerifyHandler(req, res, next, (errotMsg) => {
        _logger.error(errotMsg);
        res.status(201).json(ResponseBuilderPreset.getSuccess());
    });
};

const tokenVerify = (req: Request, res: Response, next: NextFunction) => {
    tokenVerifyHandler(req, res, next, (errorMsg) => errorHandler(errorMsg, 401, req, res));
};

export default tokenVerify;
