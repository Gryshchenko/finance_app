import { Request, Response, NextFunction } from 'express';
import { ErrorCode } from 'types/ErrorCode';
import { TranslationKey } from 'src/types/TranslationKey';
import { IUserSession } from 'interfaces/IUserSession';
import Logger from 'src/helper/logger/Logger';

import SessionService from '../services/session/SessionService';

const _logger = Logger.Of('SessionVerify');

const extractSession = (req: Request): IUserSession => {
    // @ts-ignore
    return req.session.user;
};

const sessionVerify = (req: Request, res: Response, next: NextFunction) => {
    const userSession = extractSession(req);
    if (!userSession) {
        _logger.info('session could not verify, userSession = null');
        SessionService.deleteSession(req, res, () => {
            res.status(401).json({ errorCode: ErrorCode.AUTH, msg: TranslationKey.SESSION_EXPIRED });
        });
    } else {
        _logger.info('session verify success');
        next();
    }
};

export default sessionVerify;
