import { IAccount, IAccountListItem } from 'tenpercent/shared';

import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { Logger } from '@/utils/logger/Logger';

export class AccountService extends ApiAbstract {
    protected readonly _logger: Logger = Logger.Of('AccountService');

    private static _instance: AccountService;

    public static instance(): AccountService {
        return AccountService._instance || (AccountService._instance = new AccountService());
    }

    public async doGetAccount(accountId: number): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IAccount | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Start fetching accounts');
            const userId = this._authService.userId;
            const response = await this.authGet(`/user/${userId}/account/${accountId}`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching account successfully: ${(response.data as IAccount)?.accountId}`);
            } else {
                this._logger.info(`Fetching account failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doGetAccounts(): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IAccountListItem[] | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Start fetching accounts');
            const userId = this._authService.userId;
            const response = await this.authGet(`/user/${userId}/accounts`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching accounts successfully: ${(response.data as [])?.length}`);
            } else {
                this._logger.info(`Fetching accounts failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doDeleteAccount(accountId: number): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IAccount | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info(`Start deleting account ${accountId}`);
            const userId = this._authService.userId;
            const response = await this.authDelete(`/user/${userId}/account/${accountId}`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Delete account successfully id: ${accountId}`);
            } else {
                this._logger.info(`Delete account failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doPatchAccount(
        id: number,
        body: { accountName: string; amount?: number; iconId?: string },
    ): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Start patch account');
            const userId = this._authService.userId;
            const response = await this.authPatch(`/user/${userId}/account/${id}`, {
                accountName: String(body.accountName),
                amount: Number(body.amount),
                iconId: body.iconId ? String(body.iconId) : undefined,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Patch account successfully: ${(response.data as [])?.length}`);
            } else {
                this._logger.info(`Patch account failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async doCreateAccount(body: { accountName: string; currencyId: number; amount: number; iconId: string }): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IAccount | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Start create account');
            const userId = this._authService.userId;
            const response = await this.authPost(`/user/${userId}/account`, {
                accountName: String(body.accountName),
                currencyId: Number(body.currencyId),
                amount: Number(body.amount),
                iconId: String(body.iconId),
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Create account successfully: ${(response?.data as IAccount)?.accountId}`);
            } else {
                this._logger.info(`Create account failed: ${response.kind}`);
            }
            return response;
        });
    }
}
