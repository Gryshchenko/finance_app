import { IIncome } from 'interfaces/IIncome';
import { ICreateIncome } from 'interfaces/ICreateIncome';
import { ITransaction } from 'interfaces/IDatabaseConnection';

export interface IIncomeService {
    createIncomes(userId: number, incomes: ICreateIncome[], trx?: ITransaction): Promise<IIncome[]>;
    getIncomes(userId: number): Promise<IIncome[] | undefined>;
    getIncome(userId: number, categoryId: number): Promise<IIncome | undefined>;
}
