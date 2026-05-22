import { ITransaction } from 'tenpercent/shared';

export interface ITransactionClient extends Omit<ITransaction, 'amount' | 'targetAmount' | 'rate'> {
    targetCurrencyId?: number;
    targetAmount?: string;
    amount: string;
}
