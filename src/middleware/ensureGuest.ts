import { Request, Response, NextFunction } from 'express';
import { ErrorCode } from 'types/ErrorCode';
import { IUserSession } from 'interfaces/IUserSession';
import Logger from 'src/helper/logger/Logger';

const _logger = Logger.Of('EnsureGuest');

const extractSession = (req: Request): IUserSession | undefined => {
    return req.session.user;
};

const ensureGuest = (req: Request, res: Response, next: NextFunction) => {
    const userSession = extractSession(req);
    if (userSession?.userId) {
        _logger.info('access forbidden user already authenticated');
        res.status(401).json({ errorCode: ErrorCode.AUTH });
    } else {
        _logger.info('access allow guest not authenticated');
        next();
    }
};

export default ensureGuest;
