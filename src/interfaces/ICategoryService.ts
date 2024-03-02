import { ICreateCategory } from 'interfaces/ICreateCategory';
import { ICategory } from 'interfaces/ICategory';

export interface ICategoryService {
    createCategories(userId: number, categories: ICreateCategory[]): Promise<ICategory[]>;
}
