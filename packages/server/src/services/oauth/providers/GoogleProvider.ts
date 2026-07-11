import { ErrorCode, HttpCode } from '@tenpercent/shared';
import { OAuth2Client } from 'google-auth-library';

import { getConfig } from 'src/config/config';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { ValidationError } from 'src/utils/errors/ValidationError';

import { IOAuthProvider, IOAuthUserInfo } from './IOAuthProvider';

export default class GoogleProvider extends LoggerBase implements IOAuthProvider {
    private readonly _client: OAuth2Client;

    constructor() {
        super();
        this._client = new OAuth2Client(getConfig().googleClientId);
    }

    public async verify(idToken: string): Promise<IOAuthUserInfo> {
        try {
            const ticket = await this._client.verifyIdToken({
                idToken,
                audience: getConfig().googleClientId,
            });

            const payload = ticket.getPayload();

            if (!payload || !payload.sub || !payload.email) {
                throw new ValidationError({
                    message: 'Google idToken payload missing required fields',
                    errorCode: ErrorCode.AUTH_ERROR,
                    statusCode: HttpCode.UNAUTHORIZED,
                });
            }

            return {
                providerId: payload.sub,
                email: payload.email.toLowerCase(),
                emailVerified: payload.email_verified ?? false,
            };
        } catch (e) {
            if (e instanceof ValidationError) throw e;

            this._logger.error(`Google token verification failed: ${(e as { message: string }).message}`);
            throw new ValidationError({
                message: 'Invalid Google idToken',
                errorCode: ErrorCode.AUTH_ERROR,
                statusCode: HttpCode.UNAUTHORIZED,
            });
        }
    }
}
