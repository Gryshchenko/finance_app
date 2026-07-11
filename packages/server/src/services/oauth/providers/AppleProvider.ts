import { ErrorCode, HttpCode } from '@tenpercent/shared';
import appleSignin from 'apple-signin-auth';

import { getConfig } from 'src/config/config';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { ValidationError } from 'src/utils/errors/ValidationError';

import { IOAuthProvider, IOAuthUserInfo } from './IOAuthProvider';

export default class AppleProvider extends LoggerBase implements IOAuthProvider {
    public constructor() {
        super();
    }

    public async verify(idToken: string): Promise<IOAuthUserInfo> {
        try {
            const payload = await appleSignin.verifyIdToken(idToken, {
                audience: getConfig().appleClientId,
                ignoreExpiration: false,
            });

            if (!payload || !payload.sub) {
                throw new ValidationError({
                    message: 'Apple idToken payload missing required fields',
                    errorCode: ErrorCode.AUTH_ERROR,
                    statusCode: HttpCode.UNAUTHORIZED,
                });
            }

            if (!payload.email) {
                throw new ValidationError({
                    message: 'Apple idToken does not contain email. User must share email on first sign-in.',
                    errorCode: ErrorCode.AUTH_ERROR,
                    statusCode: HttpCode.BAD_REQUEST,
                    payload: { field: 'email', reason: 'missing' },
                });
            }

            return {
                providerId: payload.sub,
                email: payload.email.toLowerCase(),
                emailVerified: payload.email_verified === 'true' || payload.email_verified === true,
            };
        } catch (e) {
            if (e instanceof ValidationError) throw e;

            this._logger.error(`Apple token verification failed: ${(e as { message: string }).message}`);
            throw new ValidationError({
                message: 'Invalid Apple idToken',
                errorCode: ErrorCode.AUTH_ERROR,
                statusCode: HttpCode.UNAUTHORIZED,
            });
        }
    }
}
