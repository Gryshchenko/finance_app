import { IAccount } from 'tenpercent/shared';
import { IAccountListItem } from 'tenpercent/shared';
import { ErrorCode } from 'tenpercent/shared';

import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { AuthService } from '@/services/AuthService';
import { Logger } from '@/utils/logger/Logger';

export class AccountService extends ApiAbstract {
    protected readonly _logger: Logger = Logger.Of('AccountService');
    private readonly _authService: AuthService;

    private static _instance: AccountService;

    public static instance(): AccountService {
        return AccountService._instance || (AccountService._instance = new AccountService(AuthService.instance()));
    }

    constructor(authService: AuthService) {
        super();
        this._authService = authService;
    }

    public async doGetAccount(accountId: number): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IAccount | undefined;
          }
        | GeneralApiProblem
    > {
        try {
            this._logger.info('Start fetching accounts');
            const userId = this._authService.userId;
            const response = await this.authGet(`/user/${userId}/account/${accountId}`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching account successfully: ${(response.data as IAccount)?.accountId}`);
            } else {
                this._logger.info(`Fetching account failed: ${response.kind}`);
            }
            return response;
        } catch (e) {
            if (__DEV__ && e instanceof Error) {
                this._logger.error(`Bad data: ${e.message}\n}`, e.stack);
            }
            return {
                kind: GeneralApiProblemKind.BadData,
                status: undefined,
                data: undefined,
                errors: [
                    {
                        errorCode: ErrorCode.CLIENT_UNKNOWN_ERROR,
                    },
                ],
            };
        }
    }

    public async doGetAccounts(): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IAccountListItem[] | undefined;
          }
        | GeneralApiProblem
    > {
        try {
            this._logger.info('Start fetching accounts');
            const userId = this._authService.userId;
            const response = await this.authGet(`/user/${userId}/accounts`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching accounts successfully: ${(response.data as [])?.length}`);
            } else {
                this._logger.info(`Fetching accounts failed: ${response.kind}`);
            }
            return response;
        } catch (e) {
            if (__DEV__ && e instanceof Error) {
                this._logger.error(`Bad data: ${e.message}\n}`, e.stack);
            }
            return {
                kind: GeneralApiProblemKind.BadData,
                status: undefined,
                data: undefined,
                errors: [
                    {
                        errorCode: ErrorCode.CLIENT_UNKNOWN_ERROR,
                    },
                ],
            };
        }
    }

    public async doDeleteAccount(accountId: number): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IAccount | undefined;
          }
        | GeneralApiProblem
    > {
        try {
            this._logger.info(`Start deleting account ${accountId}`);
            const userId = this._authService.userId;
            const response = await this.authDelete(`/user/${userId}/account/${accountId}`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Delete account successfully id: ${accountId}`);
            } else {
                this._logger.info(`Delete account failed: ${response.kind}`);
            }
            return response;
        } catch (e) {
            if (__DEV__ && e instanceof Error) {
                this._logger.error(`Bad data: ${e.message}\n}`, e.stack);
            }
            return {
                kind: GeneralApiProblemKind.BadData,
                status: undefined,
                data: undefined,
                errors: [
                    {
                        errorCode: ErrorCode.CLIENT_UNKNOWN_ERROR,
                    },
                ],
            };
        }
    }

    public async doPatchAccount(
        id: number,
        body: { accountName: string; amount?: number },
    ): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        try {
            this._logger.info('Start patch account');
            const userId = this._authService.userId;
            const response = await this.authPatch(`/user/${userId}/account/${id}`, {
                accountName: String(body.accountName),
                amount: Number(body.amount),
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Patch account successfully: ${(response.data as [])?.length}`);
            } else {
                this._logger.info(`Patch account failed: ${response.kind}`);
            }
            return response;
        } catch (e) {
            if (__DEV__ && e instanceof Error) {
                this._logger.error(`Bad data: ${e.message}\n}`, e.stack);
            }
            return {
                kind: GeneralApiProblemKind.BadData,
                status: undefined,
                data: undefined,
                errors: [
                    {
                        errorCode: ErrorCode.CLIENT_UNKNOWN_ERROR,
                    },
                ],
            };
        }
    }

    public async doCreateAccount(body: { accountName: string; currencyId: number; amount: number }): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IAccount | undefined;
          }
        | GeneralApiProblem
    > {
        try {
            this._logger.info('Start create account');
            const userId = this._authService.userId;
            const response = await this.authPost(`/user/${userId}/account`, {
                accountName: String(body.accountName),
                currencyId: Number(body.currencyId),
                amount: Number(body.amount),
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Create account successfully: ${(response?.data as IAccount)?.accountId}`);
            } else {
                this._logger.info(`Create account failed: ${response.kind}`);
            }
            return response;
        } catch (e) {
            if (__DEV__ && e instanceof Error) {
                this._logger.error(`Bad data: ${e.message}\n}`, e.stack);
            }
            return {
                kind: GeneralApiProblemKind.BadData,
                status: undefined,
                data: undefined,
                errors: [
                    {
                        errorCode: ErrorCode.CLIENT_UNKNOWN_ERROR,
                    },
                ],
            };
        }
    }
}
