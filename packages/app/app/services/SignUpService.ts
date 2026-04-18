import { ApiAbstract } from '@/services/api/apiAbstract';
import { GeneralApiProblem, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { Logger } from '@/utils/logger/Logger';

export class SignupService extends ApiAbstract {
    protected readonly _logger: Logger = Logger.Of('SignupService');

    private static _instance: SignupService;

    public static instance(): SignupService {
        return SignupService._instance || (SignupService._instance = new SignupService());
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
