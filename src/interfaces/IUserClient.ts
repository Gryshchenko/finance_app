import { IUserStatus } from 'interfaces/IUserStatus';

export interface IUserClient {
    email: string;
    status: IUserStatus;
    currency?: {
        currencyCode: string | undefined;
        currencyName: string | undefined;
        symbol: string | undefined;
    };
    profile: {
        locale: string | undefined;
    };
    additionalInfo: Record<string, undefined> | undefined;
}
