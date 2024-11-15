import { IAccountService } from 'interfaces/IAccountService';
import { ICategoryService } from 'interfaces/ICategoryService';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IIncomeService } from 'interfaces/IIncomeService';
import { IOverview } from 'interfaces/IOverview';
import { IAccount } from 'interfaces/IAccount';
import { ICategory } from 'interfaces/ICategory';
import { IIncome } from 'interfaces/IIncome';
import { ErrorCode } from 'types/ErrorCode';
import Utils from 'src/utils/Utils';
import { CustomError } from 'src/utils/errors/CustomError';
import { HttpCode } from 'types/HttpCode';

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
                this.categoryService.getCategories(validUserId),
                this.incomeService.getIncomes(validUserId),
            ]);

            return OverviewService.buildOverviewResponse({ accounts, categories, incomes });
        } catch (e) {
            this._logger.info(`Fetch overview failed due reason: ${(e as { message: string }).message}`);
            throw e;
        }
    }
}
