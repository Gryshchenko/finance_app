import { ICreateCategory } from 'interfaces/ICreateCategory';
import { ICategory } from 'interfaces/ICategory';

export interface ICategoryDataAccess {
    createCategories(userId: number, categories: ICreateCategory[]): Promise<ICategory[]>;
}
