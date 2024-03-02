import { IIncome } from 'interfaces/IIncome';
import { ICreateIncome } from 'interfaces/ICreateIncome';

export interface IIncomeService {
    createIncomes(userId: number, incomes: ICreateIncome[]): Promise<IIncome[]>;
}
