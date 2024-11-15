import { Request, Response, NextFunction } from 'express';
import Logger from 'src/helper/logger/Logger';

import SessionService from '../services/session/SessionService';
import { UserAgentService } from 'src/services/userAgentService/UserAgentService';
import { ResponseBuilderPreset } from 'helper/responseBuilder/ResponseBuilderPreset';

const _logger = Logger.Of('SessionVerify');

const errorHandler = (errorMsg: string, code: number, req: Request, res: Response) => {
    _logger.info(errorMsg);
    SessionService.deleteSession(req, res, () => {
        res.status(code).json(ResponseBuilderPreset.getAuthError());
    });
};
const sessionVerifyHandler = (req: Request, res: Response, next: NextFunction, errorHandler: (errorMsg: string) => void) => {
    const userSession = SessionService.extractSessionFromRequest(req);

    if (!userSession) {
        errorHandler('Session verification failed: user session is null');
        return;
    }

    const userAgentFromReq = UserAgentService.getUserAgent(req.headers['user-agent']);
    const userIpFromReq = SessionService.getUserIP(req);

    if (userIpFromReq !== userSession.ip) {
        errorHandler('Session verification failed: IP address does not match');
        return;
    }

    if (!UserAgentService.compareUserAgent(userAgentFromReq, userSession.userAgent)) {
        errorHandler('Session verification failed: user agent does not match');
        return;
    }

    _logger.info('Session verified successfully');
    next();
};

const sessionVerify = (req: Request, res: Response, next: NextFunction) => {
    sessionVerifyHandler(req, res, next, (errorMsg) => errorHandler(errorMsg, 401, req, res));
};
export const sessionVerifyLogout = (req: Request, res: Response, next: NextFunction) => {
    sessionVerifyHandler(req, res, next, (errorMsg) => () => {
        _logger.error(errorMsg);
        res.status(201).json(ResponseBuilderPreset.getSuccess());
    });
};

export default sessionVerify;
