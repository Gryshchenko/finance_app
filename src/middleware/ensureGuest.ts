import { NextFunction, Request, Response } from 'express';
import { ErrorCode } from 'types/ErrorCode';
import Logger from 'src/helper/logger/Logger';
import SessionService from 'src/services/session/SessionService';
import ResponseBuilder from 'src/helper/responseBuilder/ResponseBuilder';
import { ResponseStatusType } from 'types/ResponseStatusType';

const _logger = Logger.Of('EnsureGuest');

const ensureGuest = (req: Request, res: Response, next: NextFunction) => {
    const userSession = SessionService.extractSessionFromRequest(req);
    if (userSession?.userId) {
        _logger.info('access forbidden user already authenticated');
        res.status(401).json(
            new ResponseBuilder().setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: ErrorCode.AUTH }).build(),
        );
    } else {
        _logger.info('access allow guest not authenticated');
        next();
    }
};

export default ensureGuest;
