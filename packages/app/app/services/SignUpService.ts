import { IEmailConfirmationResponse } from 'tenpercent/shared';
import { IEmailResendResponse } from 'tenpercent/shared';
import { IEmailVerifyResponse } from 'tenpercent/shared';
import { ErrorCode } from 'tenpercent/shared';

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
        try {
            return await this.authGet(`/register/signup/${userId}/email-confirmation/`);
        } catch (e) {
            if (__DEV__ && e instanceof Error) {
                console.error(`Bad data: ${e.message}\n`, e.stack);
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

    public async doSignUpEmailResend(body: { userId: number }): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IEmailResendResponse;
          }
        | GeneralApiProblem
    > {
        try {
            return await this.authPost(`/register/signup/${body.userId}/email-confirmation/resend`);
        } catch (e) {
            if (__DEV__ && e instanceof Error) {
                console.error(`Bad data: ${e.message}\n`, e.stack);
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
    public async doSignUpEmailVerify(body: { confirmationCode: string; userId: number }): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IEmailVerifyResponse;
          }
        | GeneralApiProblem
    > {
        try {
            return await this.authPost(`/register/signup/${body.userId}/email-confirmation/verify`, {
                confirmationCode: body.confirmationCode,
            });
        } catch (e) {
            if (__DEV__ && e instanceof Error) {
                console.error(`Bad data: ${e.message}\n`, e.stack);
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
        try {
            return await this.publicPost(`/register/signup`, body);
        } catch (e) {
            if (__DEV__ && e instanceof Error) {
                console.error(`Bad data: ${e.message}\n`, e.stack);
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
