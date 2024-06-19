import { ICreateCategory } from 'interfaces/ICreateCategory';
import { ICategory } from 'interfaces/ICategory';
import { ITransaction } from 'interfaces/IDatabaseConnection';

export interface ICategoryDataAccess {
    createCategories(userId: number, categories: ICreateCategory[], trx?: ITransaction): Promise<ICategory[]>;
    getCategories(userId: number): Promise<ICategory[] | undefined>;
    getCategory(userId: number, categoryId: number): Promise<ICategory | undefined>;
}
