export interface IPatchTransaction {
    transactionId: number;
    accountId: number;
    targetAccountId?: number;
    incomeId?: number;
    categoryId?: number;
    amount: number;
    description: string;
    createdAt: string;
    targetAmount: number;
    targetCurrencyId: number;
}
