export interface ICreateTransaction {
    accountId: number;
    targetAccountId?: number;
    incomeId?: number;
    categoryId?: number;
    currencyId: number;
    transactionTypeId: number;
    amount: number;
    description: string;
    userId: number;
    createAt: string;
}
