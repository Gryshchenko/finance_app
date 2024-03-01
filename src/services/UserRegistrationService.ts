import { IAccountService } from 'interfaces/IAccountService';
import { ICategoryService } from 'interfaces/ICategoryService';
import { IUserService } from 'interfaces/IUserService';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IGroupService } from 'interfaces/IGroupService';
import { LanguageType } from 'types/LanguageType';
import { IIncomeService } from 'interfaces/IIncomeService';

const preMadeData = require(`../config/create_user_initial`);

interface IUserData {
    email: string;
    password: string;
    userName: string;
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

    async createUserWithDependencies(userData: IUserData) {
        // const user = await this.userService.createUser(userData.email, userData.password, userData.userName);
        // if (user) {
        //     const translatedDefaultData = this.getTranslatedDefaultData(userData.language);
        //     this._logger.info('user created');
        //
        //     const group = await this.groupService.createGroup(user.userId, translatedDefaultData.group);
        //     this._logger.info('group created');
        //
        //     const income = await this.incomeService.createIncome(user.id, translatedDefaultData.income);
        //     this._logger.info('income created');
        //
        //     const accounts = await this.accountService.createAccountsForUser(user.id, translatedDefaultData.accounts);
        //     this._logger.info('accounts created');
        //
        //     const categories = await this.categoryService.createDefaultCategories(user.id, translatedDefaultData.categories);
        //     this._logger.info('categories created');
        //     return { user, accounts, categories };
        // }
        // this._logger.info('user not created');
    }
}
