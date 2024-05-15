import { ICategoryDataAccess } from 'interfaces/ICategoryDataAccess';
import { ICategoryService } from 'interfaces/ICategoryService';
import { ICreateCategory } from 'interfaces/ICreateCategory';
import { ICategory } from 'interfaces/ICategory';

export default class CategoryService implements ICategoryService {
    private _accountDataAccess: ICategoryDataAccess;

    public constructor(accountDataAccess: ICategoryDataAccess) {
        this._accountDataAccess = accountDataAccess;
    }

    public createCategories(userId: number, categories: ICreateCategory[]): Promise<ICategory[]> {
        return this._accountDataAccess.createCategories(userId, categories);
    }
}
