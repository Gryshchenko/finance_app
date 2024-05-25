import { ICategoryDataAccess } from 'interfaces/ICategoryDataAccess';
import { ICategoryService } from 'interfaces/ICategoryService';
import { ICreateCategory } from 'interfaces/ICreateCategory';
import { ICategory } from 'interfaces/ICategory';
import { ITransaction } from 'interfaces/IDatabaseConnection';

export default class CategoryService implements ICategoryService {
    private _accountDataAccess: ICategoryDataAccess;

    public constructor(accountDataAccess: ICategoryDataAccess) {
        this._accountDataAccess = accountDataAccess;
    }

    public createCategories(userId: number, categories: ICreateCategory[], trx?: ITransaction): Promise<ICategory[]> {
        return this._accountDataAccess.createCategories(userId, categories, trx);
    }
}
