import { AccountStatusType } from 'types/AccountStatusType';

export interface IAccount {
    accountId: number;
    accountName: string;
    amount: number;
    currencyCode: string;
    symbol: string;
    iconId: string;
    colorId?: string | null;
    status: AccountStatusType;
    position: number;
}
