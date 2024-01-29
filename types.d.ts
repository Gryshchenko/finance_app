import { ISession } from 'interfaces/ISession';

declare module 'express-serve-static-core' {
    interface Request {
        session: ISession;
    }
}
