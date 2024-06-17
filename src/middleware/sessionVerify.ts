import { Request, Response, NextFunction } from 'express';
import { ErrorCode } from 'types/ErrorCode';
import Logger from 'src/helper/logger/Logger';

import SessionService from '../services/session/SessionService';
import ResponseBuilder from 'src/helper/responseBuilder/ResponseBuilder';
import { ResponseStatusType } from 'types/ResponseStatusType';
import { UserAgentService } from 'src/services/userAgentService/UserAgentService';

const _logger = Logger.Of('SessionVerify');

const sessionVerify = (req: Request, res: Response, next: NextFunction) => {
    const responseError = (errorMsg: string) => {
        _logger.info(errorMsg);
        SessionService.deleteSession(req, res, () => {
            res.status(401).json(
                new ResponseBuilder().setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: ErrorCode.AUTH }).build(),
            );
        });
    };
    const userSession = SessionService.extractSessionFromRequest(req);
    const userAgentFromReq = UserAgentService.getUserAgent(req.headers['user-agent']);
    const userIpFromReq = SessionService.getUserIP(req);
    if (!userSession) {
        responseError('session could not verify, userSession = null');
    }
    if (userIpFromReq !== userSession?.ip) {
        responseError('session could not verify, ip not same');
    }
    if (!UserAgentService.compareUserAgent(userAgentFromReq, SessionService.extractSessionFromRequest(req)?.userAgent)) {
        responseError('session could not verify, user agent not same');
    } else {
        _logger.info('session verify success');
        next();
    }
};

export default sessionVerify;
