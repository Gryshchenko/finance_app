import { ErrorCode } from '@tenpercent/shared';

import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { AuthService } from '@/services/AuthService';
import { ValidationError } from '@/utils/errors/ValidationError';
import { Logger } from '@/utils/logger/Logger';

/**
 * Password change in three calls: prove the current password, check the emailed code, then
 * send the new password together with that code.
 *
 * The code is held here, in memory, between the confirmation screen and the new-password
 * screen - the same arrangement `ForgotPasswordService` uses for its reset token. It must not
 * travel as a navigation param: navigation state is serialised and written to storage on every
 * transition (navigators/navigationUtilities.ts), which would put it on disk.
 *
 * Losing it costs nothing dangerous - the user re-enters the code from the mail they still
 * have - which is exactly why the new password is never held here alongside it.
 */
export class ChangePasswordService extends ApiAbstract {
    protected readonly _logger: Logger = Logger.Of('ChangePasswordService');

    private static _instance: ChangePasswordService;

    public static instance(): ChangePasswordService {
        return ChangePasswordService._instance || (ChangePasswordService._instance = new ChangePasswordService());
    }

    /** The code the user has already proved, waiting for the password screen to spend it. */
    protected verifiedCode: number | null = null;

    public hasVerifiedCode(): boolean {
        return this.verifiedCode !== null;
    }

    /** Step 1 - prove the current password. Mails a code; stores nothing about the new one. */
    public async request(password: string): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Send request for change password');
            this.verifiedCode = null;
            const userId = this._authService.userId;
            const response = await this.authPost<undefined>(`/user/${userId}/profile/password-change`, {
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
            // The server re-codes the pending request, so whatever was verified is now stale.
            this.verifiedCode = null;
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

    /** Step 2 - is the code right? Spends nothing; the server re-checks it on `apply`. */
    public async verifyCode(confirmationCode: number): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Verify password change code');
            const userId = this._authService.userId;
            const response = await this.authPost<undefined>(`/user/${userId}/profile/password-change/verify`, {
                confirmationCode,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this.verifiedCode = confirmationCode;
                this._logger.info('Password change code verified');
            } else {
                this.verifiedCode = null;
                this._logger.info(`Verify password change code failed: ${response.kind}`);
            }
            return response;
        });
    }

    /** Step 3 - the only call that changes anything. Ends every session on success. */
    public async apply(newPassword: string): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => {
            this._logger.info('Apply password change');
            if (this.verifiedCode === null) {
                throw new ValidationError({
                    errorCode: ErrorCode.PASSWORD_CHANGING_ERROR,
                    message: 'Password change failed, no verified confirmation code',
                });
            }
            const userId = this._authService.userId;
            const tokenLong = await AuthService.instance().getTokenLong();
            const response = await this.authPost<undefined>(`/user/${userId}/profile/password-change/apply`, {
                confirmationCode: this.verifiedCode,
                newPassword,
                tokenLong,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                this.verifiedCode = null;
                this._logger.info('Password change applied successfully');
            } else {
                // A rejected password is worth retrying with the same code; anything else means
                // the code is gone and the flow has to start over.
                if (response.kind !== GeneralApiProblemKind.BadData) {
                    this.verifiedCode = null;
                }
                this._logger.info(`Apply password change failed: ${response.kind}`);
            }
            return response;
        });
    }
}
