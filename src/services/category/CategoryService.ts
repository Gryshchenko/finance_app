import { ICategoryDataAccess } from 'interfaces/ICategoryDataAccess';
import { ICategoryService } from 'interfaces/ICategoryService';
import { ICreateCategory } from 'interfaces/ICreateCategory';
import { ICategory } from 'interfaces/ICategory';
import { ITransaction } from 'interfaces/IDatabaseConnection';

export default class CategoryService implements ICategoryService {
    private _categoryDataAccess: ICategoryDataAccess;

    public constructor(accountDataAccess: ICategoryDataAccess) {
        this._categoryDataAccess = accountDataAccess;
    }

    public createCategories(userId: number, categories: ICreateCategory[], trx?: ITransaction): Promise<ICategory[]> {
        return this._categoryDataAccess.createCategories(userId, categories, trx);
    }
    async getCategory(userId: number, accountId: number): Promise<ICategory | undefined> {
        return await this._categoryDataAccess.getCategory(userId, accountId);
    }
    async getCategories(userId: number): Promise<ICategory[] | undefined> {
        return await this._categoryDataAccess.getCategories(userId);
    }
}
