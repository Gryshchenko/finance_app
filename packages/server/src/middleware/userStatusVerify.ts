import { HttpCode, ErrorCode, ResponseStatusType, UserStatus, Utils } from '@tenpercent/shared';
import { Request, Response, NextFunction } from 'express';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { IUser } from 'interfaces/IUser';

const _logger = Logger.Of('UserStatusVerify');

const userStatusVerify = (requiredStatus: UserStatus) => (req: Request, res: Response, next: NextFunction) => {
    const userFromSession = req.user as IUser;
    if (Utils.isNull(userFromSession?.status) || requiredStatus !== userFromSession.status) {
        const responseBuilder = new ResponseBuilder();
        _logger.error(`User status verification failed, access with status: ${userFromSession.status} not allowed`);
        return res.status(HttpCode.FORBIDDEN).json(
            responseBuilder
                .setStatus(ResponseStatusType.INTERNAL)
                .setError({ errorCode: ErrorCode.USER_ERROR, payload: { field: 'userStatus', reason: 'invalid' } })
                .build(),
        );
    }
    _logger.info('User status verified successfully');
    next();
};

export default userStatusVerify;
