import { IUserClient } from 'tenpercent/shared';
import { ErrorCode } from 'tenpercent/shared';
import { Utils } from 'tenpercent/shared';
import { UserStatus } from 'tenpercent/shared';

import { buildGeneralApiBadData, GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { LoginService } from '@/services/LoginService';
import { SecureBiometricStorage } from '@/services/SecureBiometricStorage';
import { SecureStorageKey } from '@/types/SecureStorageKey';
import { ErrorUtils } from '@/utils/errors/ErrorUtils';
import { ValidationError } from '@/utils/errors/ValidationError';
import { Logger } from '@/utils/logger/Logger';

interface IExtra {
    token: string;
    tokenLong: string;
}

export class AuthService {
    protected readonly _logger: Logger = Logger.Of('AuthService');

    private static _instance: AuthService;

    public static instance(): AuthService {
        return AuthService._instance || (AuthService._instance = new AuthService());
    }

    constructor() {}

    protected _token: string | null = null;

    protected _userId: number | null = null;

    private serialization(user: IUserClient & IExtra): string | null {
        try {
            return JSON.stringify(user);
        } catch (e) {
            this._logger.error('Serialization failed due reason', e);
            return null;
        }
    }

    private deserialize(serialization: string): (IUserClient & IExtra) | null {
        try {
            return JSON.parse(serialization);
        } catch (e) {
            this._logger.error('Deserialize failed due reason', e);
            return null;
        }
    }

    public get userId(): number | null {
        return this._userId;
    }

    public set userId(value: number | null) {
        if (Utils.isNull(this._userId)) {
            this._userId = value;
        }
    }

    public set token(newToke: string) {
        this._token = newToke;
        this._logger.info('Token updated');
    }
    public get token(): string | null {
        return this._token;
    }

    public async isCredentialStored(): Promise<boolean> {
        try {
            const storage = new SecureBiometricStorage();
            const key = await storage.get(SecureStorageKey.AuthCredential);
            if (!key) {
                return false;
            }
            return true;
        } catch (e) {
            this._logger.error('Get from secure storage failed', e);
            return false;
        }
    }

    public async setCredentialToSecureStore(user: IUserClient & IExtra): Promise<void> {
        try {
            const userStr = this.serialization(user);
            if (!userStr) {
                throw new ValidationError({
                    message: 'User serialization does not exist',
                    errorCode: ErrorCode.CLIENT_UNKNOWN_ERROR,
                });
            }
            const storage = new SecureBiometricStorage();
            await storage.save(SecureStorageKey.AuthCredential, userStr);
        } catch (e) {
            this._logger.error('Secure storage set failed', (e as { message: string }).message);
        }
    }

    public async getCredentialFromSecureStore(): Promise<(IUserClient & IExtra) | null> {
        try {
            const storage = new SecureBiometricStorage();
            const key = await storage.get(SecureStorageKey.AuthCredential);
            if (!key) {
                return null;
            }
            const user = this.deserialize(key);
            const error = ErrorUtils.validateObjectFields(
                {
                    token: user?.token,
                    userId: user?.userId,
                    tokenLong: user?.tokenLong,
                },
                'GetSecureStorage',
            );
            if (error) {
                throw error;
            }
            return user as IUserClient & IExtra;
        } catch (e) {
            this._logger.error('Get from secure storage failed', e);
            return null;
        }
    }

    public async cleanCredentialStore(): Promise<void> {
        try {
            const storage = new SecureBiometricStorage();
            await storage.remove(SecureStorageKey.AuthCredential);
        } catch (e) {
            this._logger.error('Secure storage cleanup failed', (e as { message: string }).message);
        }
    }

    public async authorize({
        token,
        email,
        status,
        userId,
        tokenLong,
    }: {
        token: string;
        email?: string;
        status?: UserStatus;
        userId: number;
        tokenLong: string;
    }): Promise<boolean> {
        try {
            if (!token || !email || !status || !userId || !tokenLong) {
                throw new Error('SetAuth failed not all properties valid ');
            }

            const error = ErrorUtils.validateObjectFields(
                {
                    token,
                    email,
                    status,
                    userId,
                    tokenLong,
                },
                'SetSecureStorage',
            );
            if (error) {
                throw error;
            }
            if (status === UserStatus.INACTIVE) {
                throw new ValidationError({
                    message: 'Auth failed user in inactive state',
                    errorCode: ErrorCode.CLIENT_AUTH_ERROR,
                });
            }
            this._token = token;
            this._userId = userId;

            await this.setCredentialToSecureStore({
                userId,
                status,
                token,
                tokenLong,
                email,
            });
            return true;
        } catch (e) {
            this._logger.error(`Auth failed due reason:`, (e as { message: string }).message);
            await this.cleanCredentialStore();
            return false;
        }
    }
    public async unauthorized(): Promise<boolean> {
        try {
            this._logger.info('Start logout process');
            this._userId = null;
            this._token = null;
            await this.cleanCredentialStore();
            this._logger.info('Logout process success finished');
            return true;
        } catch (e) {
            this._logger.error('Logout process failed deu reason', (e as { message: string }).message);
            return false;
        }
    }

    public async getTokenLong(): Promise<string | null> {
        const data = await this.getCredentialFromSecureStore();
        if (!data || !data?.tokenLong) {
            return null;
        }
        return data?.tokenLong;
    }

    public async login(body: { password: string; email: string }): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IUserClient | undefined;
          }
        | GeneralApiProblem
    > {
        const error = ErrorUtils.validateObjectFields(body, 'login');
        if (error) return buildGeneralApiBadData(error);
        const { password, email } = body;
        const response = await LoginService.instance().doLogin({
            password,
            email,
        });

        if (response.kind === GeneralApiProblemKind.Ok) {
            const data = response.data as IUserClient;
            const { email, userId, status, token, tokenLong } = data;
            const error = ErrorUtils.validateObjectFields(data, 'login');
            if (error) return buildGeneralApiBadData(error);
            await this.authorize({
                email,
                status,
                userId,
                tokenLong,
                token,
            });
        }
        return response;
    }

    public async logout(): Promise<{ kind: GeneralApiProblemKind.Ok } | GeneralApiProblem> {
        const response = await LoginService.instance().doLogout();
        if (response.kind === GeneralApiProblemKind.Ok) {
            await AuthService.instance().unauthorized();
        }
        return response;
    }
}
