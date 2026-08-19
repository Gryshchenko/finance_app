import { IUserClient, ErrorCode, Utils, UserStatus, IResponse } from '@tenpercent/shared';
import { ApiResponse, ApisauceInstance, create } from 'apisauce';

import Config from '@/config';
import { IRefreshResponse } from '@/interfaces/IRefreshResponse';
import {
    buildGeneralApiBadData,
    GeneralApiProblem,
    GeneralApiProblemKind,
    getGeneralApiProblem,
} from '@/services/api/apiProblem';
import { LoginService } from '@/services/LoginService';
import { SecureStorage } from '@/services/SecureStorage';
import { SecureStorageKey } from '@/types/SecureStorageKey';
import { clearCrashReportingUser, setCrashReportingUser } from '@/utils/crashReporting';
import { ErrorUtils } from '@/utils/errors/ErrorUtils';
import { ValidationError } from '@/utils/errors/ValidationError';
import { Logger } from '@/utils/logger/Logger';

interface IExtra {
    token: string;
    tokenLong: string;
}

export class AuthService {
    protected readonly _logger: Logger = Logger.Of('AuthService');

    /**
     * Shared across every ApiAbstract subclass: each of them owns a separate axios
     * instance, so axios-auth-refresh cannot deduplicate concurrent refreshes on its
     * own. Since the server rotates the refresh token, a second concurrent call would
     * present an already-revoked token and fail.
     */
    private _refreshInFlight: Promise<boolean> | null = null;

    /**
     * Deliberately free of the auth-refresh interceptor and of axios-retry: a rotated
     * refresh token is single-use, so a replayed request would be rejected.
     */
    private readonly _api: ApisauceInstance = create({
        baseURL: Config.API_URL,
        timeout: 10000,
        headers: {
            Accept: 'application/json',
        },
    });

    private static _instance: AuthService;

    public static instance(): AuthService {
        return AuthService._instance || (AuthService._instance = new AuthService());
    }

    protected _token: string | null = null;

    protected _userId: number | null = null;

    public isAuthorized: boolean | null = false;

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
            if (value !== null) {
                setCrashReportingUser(value);
            }
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
            const storage = new SecureStorage();
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
            const storage = new SecureStorage();
            await storage.save(SecureStorageKey.AuthCredential, userStr);
        } catch (e) {
            this._logger.error('Secure storage set failed', (e as { message: string }).message);
        }
    }

    public async getCredentialFromSecureStore(): Promise<(IUserClient & IExtra) | null> {
        try {
            const storage = new SecureStorage();
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
            const storage = new SecureStorage();
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
            // Attaches the account to every crash raised from here on, so a report can be
            // matched to a support request without the app ever sending an email or a name.
            setCrashReportingUser(userId);

            await this.setCredentialToSecureStore({
                userId,
                status,
                token,
                tokenLong,
                email,
            });
            this.isAuthorized = true;
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
            // Otherwise the next person on this device inherits the previous identity.
            clearCrashReportingUser();
            this.isAuthorized = false;
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
                tokenLong: tokenLong as string,
                token,
            });
        }
        return response;
    }

    public async logout(): Promise<{ kind: GeneralApiProblemKind.Ok } | GeneralApiProblem> {
        const token = await AuthService.instance().getTokenLong();
        const response = await LoginService.instance().doLogout({ token });
        if (response.kind === GeneralApiProblemKind.Ok) {
            await AuthService.instance().unauthorized();
        }
        return response;
    }

    public async updateTokens({ token, tokenLong }: { token: string; tokenLong: string }): Promise<boolean> {
        try {
            const credential = await this.getCredentialFromSecureStore();
            if (!credential) throw new Error('Credential store empty');

            const userStr = this.serialization({ ...credential, token, tokenLong });
            if (!userStr) throw new Error('Serialization failed');

            const storage = new SecureStorage();
            await storage.save(SecureStorageKey.AuthCredential, userStr);

            this._token = token;
            return true;
        } catch (e) {
            this._logger.error('Update tokens failed', (e as { message: string }).message);
            return false;
        }
    }

    public async doRefresh(): Promise<boolean> {
        if (this._refreshInFlight) return this._refreshInFlight;

        // Reset in finally, not then: a rejected refresh must not leave the lock held
        // forever, otherwise the app can never refresh again.
        this._refreshInFlight = this.refresh().finally(() => {
            this._refreshInFlight = null;
        });

        return this._refreshInFlight;
    }

    private async refresh(): Promise<boolean> {
        try {
            if (!this.isAuthorized) return true;
            const userId = this.userId;
            if (!userId) throw new Error('refresh failed userId empty');
            const tokenLong = await this.getTokenLong();
            if (!tokenLong) throw new Error('refresh failed tokenLong empty');

            const response: ApiResponse<IResponse<IRefreshResponse>> = await this._api.post(
                `auth/${userId}/refresh`,
                { token: tokenLong },
                { headers: { Authorization: `Bearer ${this._token}` } },
            );
            if (!response.ok) {
                this._logger.error('refresh failed problem', JSON.stringify(getGeneralApiProblem(response)));
                return false;
            }

            const tokens = response.data?.data;
            if (!tokens) throw new Error('refresh failed token obj empty');
            if (!tokens.token) throw new Error('refresh failed token empty');
            if (!tokens.tokenLong) throw new Error('refresh failed tokenLong empty');

            if (!(await this.updateTokens({ token: tokens.token, tokenLong: tokens.tokenLong }))) {
                throw new Error('refresh failed to persist tokens');
            }
            this._logger.info('Token updated on refresh');
            return true;
        } catch (e) {
            this._logger.error('Token refresh failed due reason', (e as { message: string }).message);
            return false;
        }
    }
}
