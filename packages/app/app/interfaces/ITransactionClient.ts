import { ITransaction } from 'tenpercent/shared';
import { IRate } from 'tenpercent/shared/dist/interfaces/IRate';

export interface ITransactionClient extends ITransaction {
    sourceCurrencyId?: number;
    amountInCurrency?: number;
    rates: IRate | undefined;
}
