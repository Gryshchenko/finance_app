import { IIncome } from 'interfaces/IIncome';

export interface IIncomeService {
    createIncome(userId: number, incomeName: string, currencyId: number): Promise<IIncome>;
}
