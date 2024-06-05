import { Request, Response, NextFunction } from 'express';
import { ErrorCode } from 'types/ErrorCode';
import Logger from 'src/helper/logger/Logger';
import SessionService from 'services/session/SessionService';

const _logger = Logger.Of('EnsureGuest');

const ensureGuest = (req: Request, res: Response, next: NextFunction) => {
    const userSession = SessionService.extractSessionFromRequest(req);
    if (userSession?.userId) {
        _logger.info('access forbidden user already authenticated');
        res.status(401).json({ errorCode: ErrorCode.AUTH });
    } else {
        _logger.info('access allow guest not authenticated');
        next();
    }
};

export default ensureGuest;
