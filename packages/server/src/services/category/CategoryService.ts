import { ICreateCategory } from 'interfaces/ICreateCategory';
import { ICategory } from 'tenpercent/shared';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'helper/logger/LoggerBase';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { validateAllowedProperties } from 'src/utils/validation/validateAllowedProperties';
import { Utils } from 'tenpercent/shared';
import { ICategoryDataAccess } from 'services/category/CategoryDataAccess';
import { IGetStatsProperties } from 'tenpercent/shared';
import { IStatsResponse } from 'tenpercent/shared';
import { ICategoryStats } from 'tenpercent/shared';

export interface ICategoryService {
    getStats(userId: number, properties: IGetStatsProperties): Promise<IStatsResponse<ICategoryStats>>;
    create(userId: number, incomes: ICreateCategory, trx?: IDBTransaction): Promise<ICategory>;
    delete(userId: number, incomeId: number, trx?: IDBTransaction): Promise<boolean>;
    patch(userId: number, incomeId: number, properties: Partial<ICategory>, trx?: IDBTransaction): Promise<number>;
    creates(userId: number, categories: ICreateCategory[], trx?: IDBTransaction): Promise<ICategory[]>;
    gets(userId: number): Promise<ICategory[] | undefined>;
    get(userId: number, categoryId: number): Promise<ICategory | undefined>;
}

export default class CategoryService extends LoggerBase implements ICategoryService {
    private readonly _categoryDataAccess: ICategoryDataAccess;

    public constructor(accountDataAccess: ICategoryDataAccess) {
        super();
        this._categoryDataAccess = accountDataAccess;
    }
    async getStats(userId: number, properties: IGetStatsProperties): Promise<IStatsResponse<ICategoryStats>> {
        validateAllowedProperties(properties as unknown as Record<string, string | number>, ['from', 'to', 'period']);
        const response = await this._categoryDataAccess.getStats(userId, properties);
        const total = response.reduce((prev, current) => prev + Number(current.amount), 0);
        return {
            from: properties.from,
            to: properties.to,
            total,
            items: response,
        };
    }

    async create(userId: number, category: ICreateCategory, trx?: IDBTransaction): Promise<ICategory> {
        validateAllowedProperties(category as unknown as Record<string, string | number>, ['categoryName', 'currencyId', 'iconId']);
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
    async gets(userId: number): Promise<ICategory[] | undefined> {
        return await this._categoryDataAccess.gets(userId);
    }
    async delete(userId: number, categoryId: number, trx?: IDBTransaction): Promise<boolean> {
        return await this._categoryDataAccess.delete(userId, categoryId, trx);
    }
}
