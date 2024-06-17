import { IUserStatus } from 'interfaces/IUserStatus';

export interface IUserClient {
    userId: number;
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
