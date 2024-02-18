import { ISession } from 'interfaces/ISession';

declare global {
    namespace Express {
        interface Request {
            session: ISession;
        }
    }
}
