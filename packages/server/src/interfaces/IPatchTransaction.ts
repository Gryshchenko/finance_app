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
    targetCurrencyCode: string;
    // resolved server-side from the account when the account changes (currency follows the account)
    currencyCode?: string;
}
