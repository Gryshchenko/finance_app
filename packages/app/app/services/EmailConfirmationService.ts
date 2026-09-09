import { IEmailConfirmationResponse, IEmailResendResponse, IEmailVerifyResponse } from '@tenpercent/shared';

import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { Logger } from '@/utils/logger/Logger';

export class EmailConfirmationService extends ApiAbstract {
    protected readonly _logger: Logger = Logger.Of('EmailConfirmationService');

    private static _instance: EmailConfirmationService;

    public static instance(): EmailConfirmationService {
        return EmailConfirmationService._instance || (EmailConfirmationService._instance = new EmailConfirmationService());
    }

    public async getCode(): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IEmailConfirmationResponse;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Get signup confirmation code');
            const userId = this._authService.userId;
            return this.authGet(`/register/signup/${userId}/email-confirmation/`);
        });
    }

    public async refreshCode(): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IEmailResendResponse;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Resend signup confirmation code');
            const userId = this._authService.userId;
            return this.authPost(`/register/signup/${userId}/email-confirmation/resend`);
        });
    }

    public async confirm(confirmationCode: string): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IEmailVerifyResponse;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Confirm signup email');
            const userId = this._authService.userId;
            return this.authPost(`/register/signup/${userId}/email-confirmation/verify`, {
                confirmationCode: Number(confirmationCode),
            });
        });
    }
}
