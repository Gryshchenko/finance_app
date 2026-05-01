export interface ITransactionListItemsRequest {
    userId: number;
    limit: number;
    cursor?: string;
    accountId?: number;
    categoryId?: number;
    incomeId?: number;
}
