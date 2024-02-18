import { IUser } from 'interfaces/IUser';
import { IUserSession } from 'interfaces/IUserSession';
import { RoleType } from 'types/RoleType';

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
};
