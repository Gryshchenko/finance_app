import { AccountStatusType } from 'types/AccountStatusType';

export interface IAccount {
    accountId: number;
    accountName: string;
    amount: number;
    currencyId: number;
    currencyCode: string;
    symbol: string;
    iconId: string;
    status: AccountStatusType;
}
