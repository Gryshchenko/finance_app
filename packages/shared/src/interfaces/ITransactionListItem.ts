import { TransactionType } from 'types/TransactionType';

export interface ITransactionListItem {
    transactionId: number;
    incomeName?: string;
    categoryName?: string;
    accountName?: string;
    targetAccountName?: string;
    amount: number;
    description: string;
    createdAt: string;
    currencyId: number;
    transactionTypeId: TransactionType;
    targetAmount?: number;
    targetCurrencyId?: number;
}
