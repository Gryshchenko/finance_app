import { IUser } from 'interfaces/IUser';
import { IUserSession } from 'interfaces/IUserSession';
import { RoleType } from 'types/RoleType';
import { Request, Response } from 'express';
import { ResponseStatusType } from 'types/ResponseStatusType';
import { ErrorCode } from 'types/ErrorCode';
import { TranslationsKeys } from 'src/utils/translationsKeys/TranslationsKeys';
const ResponseBuilder = require('../../helper/responseBuilder/ResponseBuilder');
const Logger = require('../../helper/logger/Logger');

module.exports = class SessionUtils {
    public static deleteSession(req: Request, res: Response, cb: () => void): void {
        const _logger = Logger.Of('deleteSession');
        _logger.info('start session delete procedure');
        req.session.destroy((err) => {
            if (err) {
                _logger.error('delete session error: ' + err);
                const responseBuilder = new ResponseBuilder();
                res.status(400).json(
                    responseBuilder
                        .setStatus(ResponseStatusType.INTERNAL)
                        .setError({
                            errorCode: ErrorCode.SESSION_DESTROY_ERROR,
                            msg: TranslationsKeys.SOMETHING_WRONG,
                        })
                        .build(),
                );
            }
            res.clearCookie(process.env.SS_NAME as string, { path: '/' });
            _logger.info('delete session success');
            if (cb) {
                cb();
            }
        });
    }
    public static buildSessionObject(user: IUser, token: string, ip: string, sessionId: string): IUserSession {
        return {
            userId: user.userId,
            sessionId: sessionId,
            premission: RoleType.Default,
            createdate: user.createdat,
            updatedate: user.updatedat,
            ip,
            token,
        };
    }

    public static regenerateSession({
        req,
        user,
        err,
        handleError,
        handleSuccess,
        token,
    }: {
        req: Request;
        user: IUser;
        token: string;
        err?: string;
        handleError: (err: string) => void;
        handleSuccess: (id: string) => void;
    }): void {
        if (err) {
            handleError(err);
        }
        // @ts-ignore
        req.session.user = SessionUtils.buildSessionObject(user, token, req.ip || req.connection.remoteAddress, req.sessionID);
        req.session.save((err: string) => {
            if (err) {
                handleError(err);
            } else {
                handleSuccess(req.session.id);
            }
        });
    }
};
