import 'express-session';
import { IUserSession } from 'interfaces/IUserSession';

declare module 'express-session' {
    export interface SessionData {
        user: IUserSession | unknown;
    }
}
