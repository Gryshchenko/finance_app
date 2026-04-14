import { IEmailConfirmationResponse, IEmailResendResponse, IEmailVerifyResponse } from 'tenpercent/shared';

import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { Logger } from '@/utils/logger/Logger';

export class SignupService extends ApiAbstract {
    protected readonly _logger: Logger = Logger.Of('SignupService');

    private static _instance: SignupService;

    public static instance(): SignupService {
        return SignupService._instance || (SignupService._instance = new SignupService());
    }

    public async getSignUpConfirmationCode(userId: number): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IEmailConfirmationResponse;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => this.authGet(`/register/signup/${userId}/email-confirmation/`));
    }

    public async doSignUpEmailResend(body: { userId: number }): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IEmailResendResponse;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => this.authPost(`/register/signup/${body.userId}/email-confirmation/resend`));
    }

    public async doSignUpEmailVerify(body: { confirmationCode: string; userId: number }): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IEmailVerifyResponse;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () =>
            this.authPost(`/register/signup/${body.userId}/email-confirmation/verify`, {
                confirmationCode: body.confirmationCode,
            }),
        );
    }

    public async doSignUp(body: {
        password: string;
        email: string;
        publicName: string;
        locale: string;
        currencyCode: string;
    }): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: { userId: number } | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => this.publicPost(`/register/signup`, body));
    }
}
