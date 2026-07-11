import { ErrorCode } from '@tenpercent/shared';

import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IOAuthProviderRecord } from 'interfaces/IOAuthProvider';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { DBError } from 'src/utils/errors/DBError';

export interface IOAuthDataAccess {
    findByProviderId(provider: string, providerId: string, trx?: IDBTransaction): Promise<IOAuthProviderRecord | undefined>;
    findByUserId(userId: number, trx?: IDBTransaction): Promise<IOAuthProviderRecord[]>;
    create(
        userId: number,
        provider: string,
        providerId: string,
        email: string | null,
        trx?: IDBTransaction,
    ): Promise<IOAuthProviderRecord>;
}

export default class OAuthDataAccess extends LoggerBase implements IOAuthDataAccess {
    private readonly _db: IDatabaseConnection;

    constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    public async findByProviderId(
        provider: string,
        providerId: string,
        trx?: IDBTransaction,
    ): Promise<IOAuthProviderRecord | undefined> {
        try {
            this._logger.info(`Looking up OAuth provider: ${provider}, providerId: ${providerId}`);
            const query = trx || this._db.engine();
            const record = await query<IOAuthProviderRecord>('user_oauth_providers')
                .select('*')
                .where({ provider, providerId })
                .first();
            return record || undefined;
        } catch (e) {
            this._logger.error(`Error looking up OAuth provider: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error looking up OAuth provider: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.OAUTH_ERROR,
            });
        }
    }

    public async findByUserId(userId: number, trx?: IDBTransaction): Promise<IOAuthProviderRecord[]> {
        try {
            this._logger.info(`Looking up OAuth providers for userId: ${userId}`);
            const query = trx || this._db.engine();
            return await query<IOAuthProviderRecord>('user_oauth_providers').select('*').where({ userId });
        } catch (e) {
            this._logger.error(`Error looking up OAuth providers for userId: ${userId} - ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error looking up OAuth providers for userId: ${userId} - ${(e as { message: string }).message}`,
                errorCode: ErrorCode.OAUTH_ERROR,
            });
        }
    }

    public async create(
        userId: number,
        provider: string,
        providerId: string,
        email: string | null,
        trx?: IDBTransaction,
    ): Promise<IOAuthProviderRecord> {
        try {
            this._logger.info(`Creating OAuth link: provider=${provider}, userId=${userId}`);
            const query = trx || this._db.engine();
            const [record] = await query('user_oauth_providers').insert({ userId, provider, providerId, email }, [
                'id',
                'userId',
                'provider',
                'providerId',
                'email',
                'createdAt',
            ]);
            this._logger.info(`OAuth link created: provider=${provider}, userId=${userId}`);
            return record;
        } catch (e) {
            this._logger.error(`Error creating OAuth link: ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error creating OAuth link: ${(e as { message: string }).message}`,
                errorCode: ErrorCode.OAUTH_ERROR,
            });
        }
    }
}
