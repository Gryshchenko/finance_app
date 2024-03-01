import { ICategoryDataAccess } from 'interfaces/ICategoryDataAccess';
import { ICategoryService } from 'interfaces/ICategoryService';

module.exports = class CategoryService implements ICategoryService {
    private _accountDataAccess: ICategoryDataAccess;
    public constructor(accountDataAccess: ICategoryDataAccess) {
        this._accountDataAccess = accountDataAccess;
    }
};
