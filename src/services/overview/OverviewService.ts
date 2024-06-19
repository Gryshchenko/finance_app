import { IAccountService } from 'interfaces/IAccountService';
import { ICategoryService } from 'interfaces/ICategoryService';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IIncomeService } from 'interfaces/IIncomeService';
import { ISuccess } from 'interfaces/ISuccess';
import { IFailure } from 'interfaces/IFailure';
import { IOverview } from 'interfaces/IOverview';
import { IAccount } from 'interfaces/IAccount';
import { ICategory } from 'interfaces/ICategory';
import { IIncome } from 'interfaces/IIncome';
import Success from 'src/utils/success/Success';
import Failure from 'src/utils/failure/Failure';
import { ErrorCode } from 'types/ErrorCode';
import Utils from 'src/utils/Utils';

export default class OverviewService extends LoggerBase {
    protected accountService: IAccountService;

    protected categoryService: ICategoryService;

    protected incomeService: IIncomeService;

    constructor(services: { accountService: IAccountService; categoryService: ICategoryService; incomeService: IIncomeService }) {
        super();
        this.accountService = services.accountService;
        this.categoryService = services.categoryService;
        this.incomeService = services.incomeService;
    }

    private static buildOverviewResponse({
        accounts,
        categories,
        incomes,
    }: {
        accounts: IAccount[] | undefined;
        categories: ICategory[] | undefined;
        incomes: IIncome[] | undefined;
    }): IOverview {
        return {
            accounts: accounts ?? [],
            categories: categories ?? [],
            incomes: incomes ?? [],
        };
    }

    public async overview(userId: number | undefined): Promise<ISuccess<IOverview> | IFailure> {
        try {
            if (Utils.isNull(userId)) {
                throw new Error('Invalid user id');
            }
            const validUserId = userId as number;
            const [accounts, categories, incomes] = await Promise.all([
                this.accountService.getAccounts(validUserId),
                this.categoryService.getCategories(validUserId),
                this.incomeService.getIncomes(validUserId),
            ]);

            return new Success(OverviewService.buildOverviewResponse({ accounts, categories, incomes }));
        } catch (e) {
            this._logger.error(e);
            return new Failure(String(e), ErrorCode.OVERVIEW_ERROR);
        }
    }
}
