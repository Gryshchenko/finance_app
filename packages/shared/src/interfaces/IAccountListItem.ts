export interface IAccountListItem {
    accountId: number;
    accountName: string;
    amount: number;
    currencyId: number;
    iconId: string;
    colorId?: string | null;
    position: number;
}
