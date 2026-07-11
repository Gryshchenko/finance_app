import { ITransaction } from '@tenpercent/shared';

export interface ITransactionClient extends Omit<ITransaction, 'amount' | 'targetAmount' | 'rate'> {
    targetAmount?: string;
    amount: string;
}
