import { Request, Response, NextFunction } from 'express';
import Logger from 'src/helper/logger/Logger';
import { IUserSession } from 'interfaces/IUserSession';
import { HttpCode } from 'types/HttpCode';
import { ErrorCode } from 'types/ErrorCode';
import { ResponseStatusType } from 'types/ResponseStatusType';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';

const _logger = Logger.Of('SessionVerify');

const userIdVerify = (req: Request, res: Response, next: NextFunction) => {
    const userFromSession = req.session.user as IUserSession;
    if (parseInt(req.params.userId) !== userFromSession.userId) {
        const responseBuilder = new ResponseBuilder();
        _logger.info('UserId verified failed');
        return res
            .status(HttpCode.BAD_REQUEST)
            .json(responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: ErrorCode.AUTH }).build());
    }
    _logger.info('UserId verified successfully');
    next();
};

export default userIdVerify;
