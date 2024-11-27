import { ICreateCategory } from 'interfaces/ICreateCategory';
import { ICategory } from 'interfaces/ICategory';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';

export interface ICategoryService {
    createCategories(userId: number, categories: ICreateCategory[], trx?: IDBTransaction): Promise<ICategory[]>;
    getCategories(userId: number): Promise<ICategory[] | undefined>;
    getCategory(userId: number, categoryId: number): Promise<ICategory | undefined>;
}
