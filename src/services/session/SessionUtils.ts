import { IUser } from 'interfaces/IUser';
import { IUserSession } from 'interfaces/IUserSession';
import { RoleType } from 'types/RoleType';
import { Request, Response } from 'express';

module.exports = class SessionUtils {
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
