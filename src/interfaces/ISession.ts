import session from 'express-session';
import { IUserSession } from 'interfaces/IUserSession';

export interface ISession extends session.Session {
    user: IUserSession;
}
