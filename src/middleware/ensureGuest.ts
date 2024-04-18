import { Request, Response, NextFunction } from 'express';
import { ErrorCode } from 'types/ErrorCode';
import { TranslationKey } from 'src/types/TranslationKey';
import { IUserSession } from 'interfaces/IUserSession';
import Logger from 'src/helper/logger/Logger';

const _logger = Logger.Of('EnsureGuest');

const extractSession = (req: Request): IUserSession => {
    // @ts-ignore
    return req.session.user;
};

const ensureGuest = (req: Request, res: Response, next: NextFunction) => {
    const userSession = extractSession(req);
    if (userSession && userSession.userId) {
        _logger.info('access forbidden user already authenticated');
        res.status(401).json({ errorCode: ErrorCode.AUTH, msg: TranslationKey.ALREADY_AUTHENTICATED });
    } else {
        _logger.info('access allow guest not authenticated');
        next();
    }
};

export default ensureGuest;
