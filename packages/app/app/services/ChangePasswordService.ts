import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { AuthService } from '@/services/AuthService';
import { Logger } from '@/utils/logger/Logger';

export class ChangePasswordService extends ApiAbstract {
    protected readonly _logger: Logger = Logger.Of('ChangePasswordService');

    private static _instance: ChangePasswordService;

    public static instance(): ChangePasswordService {
        return ChangePasswordService._instance || (ChangePasswordService._instance = new ChangePasswordService());
    }

    public async request(
        newPassword: string,
        password: string,
    ): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Send request for change password');
            const userId = this._authService.userId;
            const response = await this.authPost<undefined>(`/user/${userId}/profile/password-change`, {
                newPassword,
                password,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info('Request password change successfully');
            } else {
                this._logger.info(`Request password change failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async refreshCode(): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Resend password change code');
            const userId = this._authService.userId;
            const response = await this.authPost<undefined>(`/user/${userId}/profile/password-change/resend`);
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info('Resend code successfully');
            } else {
                this._logger.info(`Resend code failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async confirm(confirmationCode: number): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Confirm password change');
            const userId = this._authService.userId;
            const tokenLong = await AuthService.instance().getTokenLong();
            const response = await this.authPost<undefined>(`/user/${userId}/profile/password-change/verify`, {
                confirmationCode,
                tokenLong,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info('Confirm password change successfully');
            } else {
                this._logger.info(`Confirm password change failed: ${response.kind}`);
            }
            return response;
        });
    }
}
