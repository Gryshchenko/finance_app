import { IOverview, ICategory, IIncome, ErrorCode, Utils, HttpCode, IAccountListItem } from 'tenpercent/shared';

import { IAccountService } from 'services/account/AccountService';
import { ICategoryService } from 'services/category/CategoryService';
import { IIncomeService } from 'services/income/IncomeService';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { CustomError } from 'src/utils/errors/CustomError';

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
        accounts: IAccountListItem[] | undefined;
        categories: ICategory[] | undefined;
        incomes: IIncome[] | undefined;
    }): IOverview {
        return {
            accounts: accounts ?? [],
            categories: categories ?? [],
            incomes: incomes ?? [],
        };
    }

    public async overview(userId: number | undefined): Promise<IOverview> {
        try {
            if (Utils.isNull(userId)) {
                throw new CustomError({
                    message: 'Invalid userId, userId cant be null',
                    statusCode: HttpCode.INTERNAL_SERVER_ERROR,
                    errorCode: ErrorCode.OVERVIEW_ERROR,
                });
            }
            const validUserId = userId as number;
            const [accounts, categories, incomes] = await Promise.all([
                this.accountService.getAccounts(validUserId),
                this.categoryService.gets(validUserId),
                this.incomeService.gets(validUserId),
            ]);

            return OverviewService.buildOverviewResponse({ accounts, categories, incomes });
        } catch (e) {
            this._logger.info(`Fetch overview failed due reason: ${(e as { message: string }).message}`);
            throw e;
        }
    }
}
