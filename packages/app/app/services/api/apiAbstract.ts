import { ApiResponse, ApisauceInstance, create } from 'apisauce';
import createAuthRefreshInterceptor from 'axios-auth-refresh';
import axiosRetry from 'axios-retry';
import { IResponse, ErrorCode, ResponseStatusType } from 'tenpercent/shared';

import Config from '@/config';
import { IClientConfig } from '@/interfaces/IClientConfig';
import { IRefreshResponse } from '@/interfaces/IRefreshResponse';
import { GeneralApiProblem, GeneralApiProblemKind, getGeneralApiProblem } from '@/services/api/apiProblem';
import type { ApiConfig } from '@/services/api/types';
import { AuthService } from '@/services/AuthService';
import { Logger } from '@/utils/logger/Logger';

export const DEFAULT_API_CONFIG = {
    url: Config.API_URL,
    timeout: 10000,
};

export abstract class ApiAbstract {
    private apisauce: ApisauceInstance;
    private config: ApiConfig;
    protected _logger: Logger = Logger.Of('ApiAbstract');
    protected readonly _authService: AuthService;

    constructor(config: ApiConfig = DEFAULT_API_CONFIG, authService: AuthService = AuthService.instance()) {
        this.config = config;
        this.apisauce = create({
            baseURL: this.config.url,
            timeout: this.config.timeout,
            headers: {
                Accept: 'application/json',
            },
        });
        this._authService = authService;
        createAuthRefreshInterceptor(this.apisauce.axiosInstance, this.refresh.bind(this));
        axiosRetry(this.apisauce.axiosInstance, {
            retries: 3,
            retryDelay: axiosRetry.exponentialDelay,
            retryCondition: (error) => axiosRetry.isNetworkOrIdempotentRequestError(error),
        });
    }

    private async refresh(): Promise<boolean> {
        try {
            const isAuthorized = this._authService.isAuthorized;
            if (!isAuthorized) return true;
            const userId = this._authService.userId;
            const tokenLong = await this._authService.getTokenLong();
            if (!userId) throw new Error('refresh failed userId empty');
            const response: ApiResponse<IResponse<IRefreshResponse>> = await this.apisauce.post(`auth/${userId}/refresh`, {
                token: tokenLong,
            });
            if (!response.ok) {
                const problem = getGeneralApiProblem(response);
                this._logger.error('refresh failed problem', JSON.stringify(problem));
                return false;
            }
            const newToken = response.data?.data?.token;
            if (!newToken) throw new Error('refresh failed token empty');
            this._authService.token = newToken;
            this._logger.info('Token updated on refresh');
            return true;
        } catch (e) {
            this._logger.error('Token refresh failed due reason', (e as { message: string }).message);
            return false;
        }
    }

    private async buildResponse<T>(fn: () => Promise<ApiResponse<IResponse<T>>>): Promise<GeneralApiProblem<T>> {
        const response = await fn();
        console.log(response);
        if (response.ok) {
            return {
                kind: GeneralApiProblemKind.Ok,
                data: response.data?.data as T,
                errors: response.data?.errors,
                status: response.data?.status,
            };
        }
        return getGeneralApiProblem(response) as GeneralApiProblem<T>;
    }

    private getAuthError<T>(msg: string): GeneralApiProblem<T> {
        return {
            kind: GeneralApiProblemKind.Unauthorized,
            errors: [{ errorCode: ErrorCode.AUTH_ERROR, msg }],
            status: ResponseStatusType.APP,
            data: undefined,
        };
    }
    private isAuthTokenExist(token: string = this._authService.token as string): boolean {
        return !!token;
    }

    protected async publicPost<T>(url: string, body?: Record<string, unknown>): Promise<GeneralApiProblem<T>> {
        try {
            return await this.buildResponse(async () => await this.apisauce.post(url, body));
        } catch (e) {
            this._logger.error('publicPost failed due reason', (e as { message: string }).message);
            return {
                kind: GeneralApiProblemKind.BadData,
                data: undefined,
                errors: undefined,
                status: ResponseStatusType.INTERNAL,
            };
        }
    }
    protected async authPost<T>(
        url: string,
        body?: Record<string, unknown>,
        options: {
            token: string;
        } = {
            token: this._authService.token as string,
        },
    ): Promise<GeneralApiProblem<T>> {
        const { token } = options;
        if (!this.isAuthTokenExist(token)) {
            return this.getAuthError<T>('Token not exist');
        }

        return await this.buildResponse(
            async () =>
                await this.apisauce.post(url, body, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),
        );
    }
    protected async getConfig(): Promise<GeneralApiProblem<IClientConfig | undefined>> {
        try {
            const response: ApiResponse<IClientConfig> = await this.apisauce.get('/public/config.json', {}, {});
            if (response.ok) {
                return {
                    kind: GeneralApiProblemKind.Ok,
                    data: response.data,
                    errors: [],
                    status: undefined,
                };
            }
            throw new Error(`problem: ${response.problem}, status: ${response.status}`);
        } catch (e) {
            this._logger.error(`Get client config error: ${JSON.stringify(e)}`);
            return {
                kind: GeneralApiProblemKind.BadData,
                data: undefined,
                errors: [{ errorCode: ErrorCode.CLIENT_UNKNOWN_ERROR }],
                status: ResponseStatusType.APP,
            };
        }
    }

    protected async authGet<T>(
        url: string,
        options: {
            token: string;
        } = {
            token: this._authService.token as string,
        },
    ): Promise<GeneralApiProblem<T>> {
        const { token } = options;
        if (!this.isAuthTokenExist(token)) return this.getAuthError('Token not exist');
        return await this.buildResponse(
            async () => await this.apisauce.get(url, {}, { headers: { Authorization: `Bearer ${token}` } }),
        );
    }
    protected async authPatch<T>(
        url: string,
        body: Record<string, unknown>,
        options: {
            token: string;
        } = {
            token: this._authService.token as string,
        },
    ): Promise<GeneralApiProblem<T>> {
        const { token } = options;
        if (!this.isAuthTokenExist(token)) return this.getAuthError('Token not exist');
        return await this.buildResponse(
            async () => await this.apisauce.patch(url, body, { headers: { Authorization: `Bearer ${token}` } }),
        );
    }
    protected async withErrorHandler<T>(
        fn: () => Promise<GeneralApiProblem<T>>,
        errorCode: ErrorCode = ErrorCode.CLIENT_UNKNOWN_ERROR,
    ): Promise<GeneralApiProblem<T>> {
        try {
            return await fn();
        } catch (e) {
            if (__DEV__ && e instanceof Error) {
                this._logger.error(`Bad data: ${e.message}`, e.stack);
            }
            return {
                kind: GeneralApiProblemKind.BadData,
                status: undefined,
                data: undefined,
                errors: [{ errorCode }],
            };
        }
    }

    protected async authDelete<T>(
        url: string,
        options: {
            token: string;
        } = {
            token: this._authService.token as string,
        },
    ): Promise<GeneralApiProblem<T>> {
        const { token } = options;
        if (!this.isAuthTokenExist(token)) return this.getAuthError('Token not exist');
        return await this.buildResponse(
            async () => await this.apisauce.delete(url, {}, { headers: { Authorization: `Bearer ${token}` } }),
        );
    }
}
