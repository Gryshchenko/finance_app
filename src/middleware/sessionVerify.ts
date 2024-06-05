import { Request, Response, NextFunction } from 'express';
import { ErrorCode } from 'types/ErrorCode';
import Logger from 'src/helper/logger/Logger';

import SessionService from '../services/session/SessionService';

const _logger = Logger.Of('SessionVerify');

const sessionVerify = (req: Request, res: Response, next: NextFunction) => {
    const userSession = SessionService.extractSessionFromRequest(req);
    if (!userSession) {
        _logger.info('session could not verify, userSession = null');
        SessionService.deleteSession(req, res, () => {
            res.status(401).json({ errorCode: ErrorCode.AUTH });
        });
    } else {
        _logger.info('session verify success');
        next();
    }
};

export default sessionVerify;
