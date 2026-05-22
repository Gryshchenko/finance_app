export interface ICreateTransaction {
    accountId: number;
    targetAccountId?: number;
    incomeId?: number;
    categoryId?: number;
    currencyId: number;
    targetCurrencyId: number;
    transactionTypeId: number;
    amount: number;
    targetAmount?: number;
    description: string;
    userId: number;
    createdAt: string;
}
