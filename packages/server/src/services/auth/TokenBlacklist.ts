import { HttpCode, ErrorCode } from '@tenpercent/shared';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { IKeyValueStore } from 'src/repositories/keyValueStore/KeyValueStore';
import { CustomError } from 'src/utils/errors/CustomError';

class TokenBlacklist {
    private store: IKeyValueStore;
    private static _instance: TokenBlacklist;

    private constructor(store: IKeyValueStore) {
        this.store = store;
    }

    public static instance(store: IKeyValueStore) {
        if (!TokenBlacklist._instance) {
            TokenBlacklist._instance = new TokenBlacklist(store);
        }
        return TokenBlacklist._instance;
    }

    async blacklistToken(token: string) {
        const decoded = jwt.decode(token) as jwt.JwtPayload;

        if (!decoded || !decoded.exp) {
            throw new CustomError({
                message: 'Invalid token, no exp field',
                statusCode: HttpCode.UNAUTHORIZED,
                errorCode: ErrorCode.TOKEN_EXPIRED_ERROR,
            });
        }

        const ttl = decoded.exp - Math.floor(Date.now() / 1000);

        if (ttl > 0) {
            const key = this.keyFor(token);
            await this.store.set(key, true, ttl);
        }
    }

    async isBlacklisted(token: string): Promise<boolean> {
        const key = this.keyFor(token);
        return await this.store.exists(key);
    }

    private keyFor(token: string): string {
        const hash = crypto.createHash('sha256').update(token).digest('hex');
        return `blacklist:${hash}`;
    }
    async revokeOnce(token: string): Promise<boolean> {
        const decoded = jwt.decode(token) as jwt.JwtPayload;

        if (!decoded || !decoded.exp) {
            throw new CustomError({
                message: 'Invalid token, no exp field',
                statusCode: HttpCode.UNAUTHORIZED,
                errorCode: ErrorCode.TOKEN_EXPIRED_ERROR,
            });
        }

        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl <= 0) return false;

        return this.store.setIfNotExists(this.keyFor(token), true, ttl);
    }
}

export { TokenBlacklist };
