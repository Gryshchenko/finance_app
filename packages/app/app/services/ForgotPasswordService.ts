import { ErrorCode } from 'tenpercent/shared';

import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { ValidationError } from '@/utils/errors/ValidationError';
import { Logger } from '@/utils/logger/Logger';

export class ForgotPasswordService extends ApiAbstract {
    protected readonly _logger: Logger = Logger.Of('ForgotPasswordService');

    private static _instance: ForgotPasswordService;

    public static instance(): ForgotPasswordService {
        return ForgotPasswordService._instance || (ForgotPasswordService._instance = new ForgotPasswordService());
    }

    protected authorization: { userId: number; resetToken: string } | null = null;

    public async change(newPassword: string): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Send request for change password');
            if (this.authorization && this.authorization.userId && this.authorization.resetToken) {
                const { userId, resetToken } = this.authorization;
                const response = await this.authPost(
                    `/auth/${userId}/forget-change`,
                    {
                        newPassword,
                    },
                    {
                        token: resetToken,
                    },
                );
                if (response.kind === GeneralApiProblemKind.Ok) {
                    this.authorization = null;
                    this._logger.info('Request password change successfully');
                } else {
                    if (response.kind !== GeneralApiProblemKind.BadData) {
                        this.authorization = null;
                    }
                    this._logger.info(`Request password change failed: ${response.kind}`);
                }
                return response;
            }
            throw new ValidationError({
                errorCode: ErrorCode.RESET_PASSWORD_ERROR,
                message: 'Reset password change failed, authorization data not found',
            });
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
            this._logger.info('Resend password change code');
            const response = await this.publicPost<undefined>(`/auth/forget-refresh`, {
                email,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info('Resend code successfully');
            } else {
                this._logger.info(`Resend code failed: ${response.kind}`);
            }
            return response;
        });
    }
    public async request(email: string): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Confirm password change');
            const response = await this.publicPost<undefined>(`/auth/forget`, {
                email,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this._logger.info('Confirm password change successfully');
            } else {
                this._logger.info(`Confirm password change failed: ${response.kind}`);
            }
            return response;
        });
    }

    public async confirm(
        email: string,
        confirmationCode: string,
    ): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: { resetToken: string; userId: number };
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Confirm password change');
            const response = await this.publicPost<{ resetToken: string; userId: number }>(`/auth/forget-confirm`, {
                email,
                confirmationCode,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                const { resetToken, userId } = response.data as { resetToken: string; userId: number };
                if (!resetToken) {
                    throw new ValidationError({
                        errorCode: ErrorCode.RESET_PASSWORD_ERROR,
                        message: 'Reset password change failed, reset token empty',
                    });
                }
                if (!userId) {
                    throw new ValidationError({
                        errorCode: ErrorCode.RESET_PASSWORD_ERROR,
                        message: 'Reset password change failed, userId empty',
                    });
                }
                this.authorization = Object.freeze({
                    resetToken,
                    userId,
                });
                this._logger.info('Confirm password change successfully');
            } else {
                this._logger.info(`Confirm password change failed: ${response.kind}`);
            }
            return response;
        });
    }
}
