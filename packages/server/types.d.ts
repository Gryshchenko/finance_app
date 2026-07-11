import 'express-session';
import { UserStatus } from '@tenpercent/shared';

declare global {
    namespace Express {
        interface User {
            userId: number;
            email?: string;
            status?: UserStatus;
        }
    }
}
