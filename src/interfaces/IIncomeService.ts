import { IIncome } from 'interfaces/IIncome';
import { ICreateIncome } from 'interfaces/ICreateIncome';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';

export interface IIncomeService {
    createIncomes(userId: number, incomes: ICreateIncome[], trx?: IDBTransaction): Promise<IIncome[]>;
    getIncomes(userId: number): Promise<IIncome[] | undefined>;
    getIncome(userId: number, categoryId: number): Promise<IIncome | undefined>;
}
