import { IUserClient } from 'tenpercent/shared';
import { ErrorCode } from 'tenpercent/shared';

import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { Logger } from '@/utils/logger/Logger';

export class LoginService extends ApiAbstract {
    protected readonly _logger: Logger = Logger.Of('LoginService');

    private static _instance: LoginService;

    public static instance(): LoginService {
        return LoginService._instance || (LoginService._instance = new LoginService());
    }

    public async doTokenVerify(body: { userId: number }): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IUserClient | undefined;
          }
        | GeneralApiProblem
    > {
        try {
            return await this.authGet(`/auth/${body.userId}/verify`);
        } catch (e) {
            if (__DEV__ && e instanceof Error) {
                console.error(`Bad data: ${e.message}\n}`, e.stack);
            }
            return {
                kind: GeneralApiProblemKind.BadData,
                status: undefined,
                data: undefined,
                errors: [
                    {
                        errorCode: ErrorCode.AUTH_ERROR,
                    },
                ],
            };
        }
    }
    public async doLogout(): Promise<{ kind: GeneralApiProblemKind.Ok } | GeneralApiProblem> {
        try {
            return await this.authPost(`/auth/logout`);
        } catch (e) {
            if (__DEV__ && e instanceof Error) {
                console.error(`Bad data: ${e.message}`, e.stack);
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
    public async doLogin(body: { password: string; email: string }): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IUserClient | undefined;
          }
        | GeneralApiProblem
    > {
        try {
            return await this.publicPost(`/auth/login`, body);
        } catch (e) {
            if (__DEV__ && e instanceof Error) {
                console.error(`Bad data: ${e.message}`, e.stack);
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
