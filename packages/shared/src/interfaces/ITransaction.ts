export interface ITransaction {
    transactionId: number;
    targetAccountId?: number;
    targetAmount: number;
    targetCurrencyCode?: string;
    accountId: number;
    incomeId?: number;
    categoryId?: number;
    currencyCode: string;
    transactionTypeId: number;
    amount: number;
    description: string;
    createdAt: string;
}
