import { IIncome } from 'interfaces/IIncome';

export interface IIncomeDataAccess {
    createIncome(userId: number, incomeName: string[], currencyId: number): Promise<IIncome[]>;
}
