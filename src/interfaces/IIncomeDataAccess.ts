import { IIncome } from 'interfaces/IIncome';
import { ICreateIncome } from 'interfaces/ICreateIncome';
import { ITransaction } from 'interfaces/IDatabaseConnection';

export interface IIncomeDataAccess {
    createIncomes(userId: number, incomes: ICreateIncome[], trx?: ITransaction): Promise<IIncome[]>;
}
