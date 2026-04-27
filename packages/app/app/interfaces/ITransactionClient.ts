import { ITransaction } from 'tenpercent/shared';
import { IRate } from 'tenpercent/shared/dist/interfaces/IRate';

export interface ITransactionClient extends Omit<ITransaction, 'amount'> {
    sourceCurrencyId?: number;
    amountInCurrency?: string;
    rates: IRate | undefined;
    amount: string;
}
