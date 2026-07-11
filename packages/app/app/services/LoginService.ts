import { IUserClient, ErrorCode } from '@tenpercent/shared';

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
        return this.withErrorHandler(async () => this.authGet(`/auth/${body.userId}/verify`), ErrorCode.AUTH_ERROR);
    }

    public async doLogout(): Promise<{ kind: GeneralApiProblemKind.Ok } | GeneralApiProblem> {
        return this.withErrorHandler(async () => this.authPost(`/auth/logout`));
    }

    public async doLogin(body: { password: string; email: string }): Promise<
        | {
              kind: GeneralApiProblemKind.Ok;
              data: IUserClient | undefined;
          }
        | GeneralApiProblem
    > {
        return this.withErrorHandler(async () => this.publicPost(`/auth/login`, body));
    }
}
