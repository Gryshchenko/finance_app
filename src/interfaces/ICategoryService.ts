import { ICreateCategory } from 'interfaces/ICreateCategory';
import { ICategory } from 'interfaces/ICategory';
import { ITransaction } from 'interfaces/IDatabaseConnection';

export interface ICategoryService {
    createCategories(userId: number, categories: ICreateCategory[], trx?: ITransaction): Promise<ICategory[]>;
}
