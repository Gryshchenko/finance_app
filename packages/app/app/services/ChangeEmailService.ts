import { IProfileEmailChangeResponse } from '@/interfaces/IProfileEmailChangeResponse';
import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { Logger } from '@/utils/logger/Logger';

export class ChangeEmailService extends ApiAbstract {
    protected readonly _logger: Logger = Logger.Of('ChangeEmailService');

    private static _instance: ChangeEmailService;

    public static instance(): ChangeEmailService {
        return ChangeEmailService._instance || (ChangeEmailService._instance = new ChangeEmailService());
    }

    public async request(email: string): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IProfileEmailChangeResponse | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Send request for change email');
            const userId = this._authService.userId;
            const response = await this.authPost<IProfileEmailChangeResponse>(`/user/${userId}/profile/email-change`, {
                newEmail: email,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching request successfully`);
            } else {
                this._logger.info(`Fetching request failed: ${response.kind}`);
            }
            return response;
        });
    }
    public async refreshCode(email: string): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Start fetching refresh');
            const userId = this._authService.userId;
            const response = await this.authPost(`/user/${userId}/profile/email-change/resend`, {
                newEmail: email,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching refresh successfully`);
            } else {
                this._logger.info(`Fetching refresh failed: ${response.kind}`);
            }
            return response;
        });
    }
    public async confirm(
        confirmationCode: number,
        email: string,
    ): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Start fetching profile');
            const userId = this._authService.userId;
            const response = await this.authPost<undefined>(`/user/${userId}/profile/email-change/verify`, {
                confirmationCode,
                newEmail: email,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info(`Fetching profile successfully`);
            } else {
                this._logger.info(`Fetching profile failed: ${response.kind}`);
            }
            return response;
        });
    }
}
