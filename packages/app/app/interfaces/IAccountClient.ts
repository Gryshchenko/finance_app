import { IAccount } from '@tenpercent/shared';

export interface IAccountClient extends Partial<Omit<IAccount, 'amount'>> {
    amount: number | undefined;
}
