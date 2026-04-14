import { IAccountListItem } from 'interfaces/IAccountListItem';
import { ICategory } from 'interfaces/ICategory';
import { IIncome } from 'interfaces/IIncome';

export interface IOverview {
    accounts: IAccountListItem[] | [];
    categories: ICategory[] | [];
    incomes: IIncome[] | [];
}
