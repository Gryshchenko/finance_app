import { ApiResponse, ApisauceInstance, create } from 'apisauce';
import { IResponse } from 'tenpercent/shared';
import { IResponseError } from 'tenpercent/shared';
import { ErrorCode } from 'tenpercent/shared';
import { ResponseStatusType } from 'tenpercent/shared';

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

const MAX_TRY = 1;

export abstract class ApiAbstract {
    private apisauce: ApisauceInstance;
    private config: ApiConfig;
    protected _logger: Logger = Logger.Of('ApiAbstract');

    constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
        this.config = config;
        this.apisauce = create({
            baseURL: this.config.url,
            timeout: this.config.timeout,
            headers: {
                Accept: 'application/json',
            },
        });
    }

    private async refresh(): Promise<boolean> {
        try {
            const userId = AuthService.instance().userId;
            const tokenLong = await AuthService.instance().getTokenLong();
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
            AuthService.instance().token = newToken;
            this._logger.info('Token updated on refresh');
            return true;
        } catch (e) {
            this._logger.error('Token refresh failed due reason', (e as { message: string }).message);
            return false;
        }
    }

    private async withRetry<T>(fn: () => Promise<ApiResponse<IResponse<T>>>): Promise<GeneralApiProblem<T>> {
        let counter = 0;
        while (counter < MAX_TRY) {
            const response = await fn();
            counter++;
            if (response.ok) {
                return {
                    kind: GeneralApiProblemKind.Ok,
                    data: response.data?.data as T,
                    errors: response.data?.errors,
                    status: response.data?.status,
                };
            }
            const errors = response.data?.errors as IResponseError[];
            if (errors?.some((e) => e.errorCode !== ErrorCode.TOKEN_EXPIRED_ERROR)) {
                return getGeneralApiProblem(response) as GeneralApiProblem<T>;
            }
            this._logger.info('Request token update on refresh');
            const isSuccess = await this.refresh();
            if (isSuccess) {
                continue;
            } else {
                await AuthService.instance().unauthorized();
                break;
            }
        }
        return {
            kind: GeneralApiProblemKind.BadData,
            data: undefined,
            errors: [{ errorCode: ErrorCode.CLIENT_UNKNOWN_ERROR }],
            status: ResponseStatusType.APP,
        };
    }

    private getAuthError<T>(msg: string): GeneralApiProblem<T> {
        return {
            kind: GeneralApiProblemKind.Unauthorized,
            errors: [{ errorCode: ErrorCode.AUTH_ERROR, msg }],
            status: ResponseStatusType.APP,
            data: undefined,
        };
    }
    private isAuthTokenExist(token: string = AuthService.instance().token as string): boolean {
        return token !== undefined && token !== null;
    }

    protected async publicPost<T>(url: string, body?: Record<string, unknown>): Promise<GeneralApiProblem<T>> {
        try {
            const response: ApiResponse<IResponse<T>> = await this.apisauce.post(url, body);
            if (response.ok) {
                return {
                    kind: GeneralApiProblemKind.Ok,
                    data: response.data?.data as T,
                    errors: response.data?.errors,
                    status: response.data?.status,
                };
            }
            return getGeneralApiProblem(response) as GeneralApiProblem<T>;
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
            token: AuthService.instance().token as string,
        },
    ): Promise<GeneralApiProblem<T>> {
        const { token } = options;
        if (!this.isAuthTokenExist(token)) {
            return this.getAuthError<T>('Token not exist');
        }

        return await this.withRetry(
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
            token: AuthService.instance().token as string,
        },
    ): Promise<GeneralApiProblem<T>> {
        const { token } = options;
        if (!this.isAuthTokenExist(token)) return this.getAuthError('Token not exist');
        return await this.withRetry(async () => {
            const response: ApiResponse<IResponse<T>> = await this.apisauce.get(
                url,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            return response;
        });
    }
    protected async authPatch<T>(
        url: string,
        body: Record<string, unknown>,
        options: {
            token: string;
        } = {
            token: AuthService.instance().token as string,
        },
    ): Promise<GeneralApiProblem<T>> {
        const { token } = options;
        if (!this.isAuthTokenExist(token)) return this.getAuthError('Token not exist');
        return await this.withRetry(async () => {
            const response: ApiResponse<IResponse<T>> = await this.apisauce.patch(url, body, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response;
        });
    }
    protected async authDelete<T>(
        url: string,
        options: {
            token: string;
        } = {
            token: AuthService.instance().token as string,
        },
    ): Promise<GeneralApiProblem<T>> {
        const { token } = options;
        if (!this.isAuthTokenExist(token)) return this.getAuthError('Token not exist');
        return await this.withRetry(async () => {
            const response: ApiResponse<IResponse<T>> = await this.apisauce.delete(
                url,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            return response;
        });
    }
}
