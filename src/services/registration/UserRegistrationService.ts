import { IAccountService } from 'interfaces/IAccountService';
import { ICategoryService } from 'interfaces/ICategoryService';
import { IUserService } from 'interfaces/IUserService';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IGroupService } from 'interfaces/IGroupService';
import { LanguageType } from 'types/LanguageType';
import { IIncomeService } from 'interfaces/IIncomeService';

const preMadeData = require(`../../config/create_user_initial`);

interface IUserData {
    email: string;
    password: string;
    language?: LanguageType;
}

interface IDefaultData {
    group: string;
    income: string[];
    accounts: string[];
    categories: string[];
}

class UserRegistrationService extends LoggerBase {
    protected userService: IUserService;
    protected accountService: IAccountService;
    protected categoryService: ICategoryService;
    protected groupService: IGroupService;
    protected incomeService: IIncomeService;

    constructor(
        userService: IUserService,
        accountService: IAccountService,
        categoryService: ICategoryService,
        groupService: IGroupService,
        incomeService: IIncomeService,
    ) {
        super();
        this.userService = userService;
        this.accountService = accountService;
        this.categoryService = categoryService;
        this.groupService = groupService;
        this.incomeService = incomeService;
    }

    private getTranslatedDefaultData(language: LanguageType = LanguageType.US): IDefaultData {
        return preMadeData[language];
    }

    async createUser(userData: IUserData) {
        const user = await this.userService.createUser(userData.email, userData.password);
        if (user) {
            const translatedDefaultData = this.getTranslatedDefaultData(userData.language);
            this._logger.info('user created');

            const group = await this.groupService.createGroup(user.userId, translatedDefaultData.group);
            this._logger.info('group created');

            const income = await this.incomeService.createIncomes(
                user.userId,
                translatedDefaultData.income.map((incomeName) => ({
                    incomeName,
                    currencyId: 10,
                })),
            );
            this._logger.info('income created');

            const accounts = await this.accountService.createAccounts(
                user.userId,
                translatedDefaultData.accounts.map((accountName: string) => ({
                    accountName,
                    amount: 0,
                    currencyId: 10,
                })),
            );
            this._logger.info('accounts created');
            //
            const categories = await this.categoryService.createCategories(
                user.userId,
                translatedDefaultData.categories.map((categoryName: string) => ({
                    categoryName,
                    currencyId: 10,
                })),
            );
            this._logger.info('categories created');
            return { user, accounts, categories, group, income };
        }
        this._logger.info('user not created');
    }
}
