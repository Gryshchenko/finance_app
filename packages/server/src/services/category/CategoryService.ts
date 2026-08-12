import { ICategory, StatsScope, Utils } from '@tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { ICreateCategory } from 'interfaces/ICreateCategory';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { ICategoryDataAccess } from 'services/category/CategoryDataAccess';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { validateAllowedProperties } from 'src/utils/validation/validateAllowedProperties';

export interface ICategoryService {
    create(userId: number, incomes: ICreateCategory, trx?: IDBTransaction): Promise<ICategory>;
    delete(userId: number, incomeId: number, trx?: IDBTransaction): Promise<boolean>;
    patch(userId: number, incomeId: number, properties: Partial<ICategory>, trx?: IDBTransaction): Promise<number>;
    creates(userId: number, categories: ICreateCategory[], trx?: IDBTransaction): Promise<ICategory[]>;
    gets(userId: number, scope?: StatsScope): Promise<ICategory[] | undefined>;
    get(userId: number, categoryId: number): Promise<ICategory | undefined>;
}

export default class CategoryService extends LoggerBase implements ICategoryService {
    private readonly _categoryDataAccess: ICategoryDataAccess;

    public constructor(accountDataAccess: ICategoryDataAccess) {
        super();
        this._categoryDataAccess = accountDataAccess;
    }
    async create(userId: number, category: ICreateCategory, trx?: IDBTransaction): Promise<ICategory> {
        validateAllowedProperties(category as unknown as Record<string, string | number>, [
            'categoryName',
            'currencyCode',
            'iconId',
            'budget',
        ]);
        const categories = await this._categoryDataAccess.create(userId, [category], trx);
        return categories[0];
    }
    async creates(userId: number, categories: ICreateCategory[], trx?: IDBTransaction): Promise<ICategory[]> {
        return await this._categoryDataAccess.create(userId, categories, trx);
    }
    async patch(userId: number, categoryId: number, properties: Partial<ICategory>, trx?: IDBTransaction): Promise<number> {
        return await this._categoryDataAccess.patch(userId, categoryId, properties, trx);
    }
    async get(userId: number, categoryId: number): Promise<ICategory | undefined> {
        try {
            if (Utils.isNull(categoryId)) {
                throw new ValidationError({ message: 'categoryId cant be null' });
            }
            if (Utils.isNull(userId)) {
                throw new ValidationError({ message: 'userId cant be null' });
            }
            return await this._categoryDataAccess.get(userId, categoryId);
        } catch (e: unknown) {
            this._logger.error(`Fetch category failed due reason: ${(e as { message: string }).message}`);
            throw e;
        }
    }
    async gets(userId: number, scope?: StatsScope): Promise<ICategory[] | undefined> {
        return await this._categoryDataAccess.gets(userId, scope);
    }
    async delete(userId: number, categoryId: number, trx?: IDBTransaction): Promise<boolean> {
        return await this._categoryDataAccess.delete(userId, categoryId, trx);
    }
}
