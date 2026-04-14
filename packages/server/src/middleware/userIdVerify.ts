import { Request, Response, NextFunction } from 'express';
import { HttpCode, ErrorCode, ResponseStatusType, Utils } from 'tenpercent/shared';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';

const _logger = Logger.Of('UserIdVerify');

const userIdVerify = (req: Request, res: Response, next: NextFunction) => {
    const userFromSession = req.user;
    if (
        Utils.isNull(req.params?.userId) ||
        Utils.isNull(userFromSession?.userId) ||
        parseInt(req.params?.userId) !== userFromSession?.userId
    ) {
        const responseBuilder = new ResponseBuilder();
        _logger.error('UserId verified failed');
        return res
            .status(HttpCode.FORBIDDEN)
            .json(responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: ErrorCode.AUTH_ERROR }).build());
    }
    _logger.info('UserId verified successfully');
    next();
};

export default userIdVerify;
