import { Request, Response, NextFunction } from 'express';
import { VerifyErrors } from 'jsonwebtoken';
import { ErrorCode } from 'types/ErrorCode';
import Logger from 'src/helper/logger/Logger';
import SessionService from '../services/session/SessionService';
import { getConfig } from 'src/config/config';
import ResponseBuilder from 'src/helper/responseBuilder/ResponseBuilder';
import { ResponseStatusType } from 'types/ResponseStatusType';
const crypto = require('crypto');

const jwt = require('jsonwebtoken');

const _logger = Logger.Of('TokenVerify');

const extractToken = (req: Request) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    }
    return null;
};

const tokenVerify = (req: Request, res: Response, next: NextFunction) => {
    const token = extractToken(req);
    const sessionToken = SessionService.extractSessionFromRequest(req)?.token;
    const sendErrorResponse = () => {
        SessionService.deleteSession(req, res, () => {
            res.status(401).json(
                new ResponseBuilder().setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: ErrorCode.AUTH }).build(),
            );
        });
    };
    if (!token) {
        sendErrorResponse();
        _logger.info('token not verify, token = null');
        return;
    }
    if (!sessionToken) {
        sendErrorResponse();
        _logger.info('session token not verify, token = null');
        return;
    }
    console.log(token, sessionToken);
    const tokenBuffer = Buffer.from(token, 'utf-8');
    const sessionTokenBuffer = Buffer.from(sessionToken, 'utf-8');

    if (tokenBuffer.length === sessionTokenBuffer.length && crypto.timingSafeEqual(tokenBuffer, sessionTokenBuffer)) {
        jwt.verify(token, getConfig().jwtSecret ?? null, (err: VerifyErrors & { complete: boolean }) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    sendErrorResponse();
                    _logger.info('token not verify, token expired');
                } else {
                    sendErrorResponse();
                    _logger.info('token not verify, token invalid');
                }
            } else {
                _logger.info('token verify success');
                next();
            }
        });
    } else {
        sendErrorResponse();
        _logger.info('token not verify, token and session token not same');
    }
};

export default tokenVerify;
