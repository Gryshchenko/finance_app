export interface ICreateTransaction {
    accountId: number;
    targetAccountId?: number;
    incomeId?: number;
    categoryId?: number;
    currencyCode: string;
    targetCurrencyCode: string;
    transactionTypeId: number;
    amount: number;
    targetAmount: number;
    description: string;
    userId: number;
    createdAt: string;
}
