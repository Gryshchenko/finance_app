export interface ITransaction {
    transactionId: number;
    targetAccountId?: number;
    targetAmount?: number;
    targetCurrencyId?: number;
    accountId: number;
    incomeId?: number;
    categoryId?: number;
    currencyId: number;
    currencyCode: string;
    currencyName: string;
    symbol: string;
    transactionTypeId: number;
    amount: number;
    description: string;
    createdAt: string;
}
