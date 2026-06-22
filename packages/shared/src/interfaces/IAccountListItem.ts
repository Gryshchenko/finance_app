export interface IAccountListItem {
    accountId: number;
    accountName: string;
    amount: number;
    currencyCode: string;
    iconId: string;
    colorId?: string | null;
    position: number;
}
