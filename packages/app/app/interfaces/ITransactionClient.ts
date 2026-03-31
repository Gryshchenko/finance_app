import { ITransaction } from 'tenpercent/shared';

export interface ITransactionClient extends ITransaction {
    destinationCurrencyId?: number;
    amountConverter?: number;
}
