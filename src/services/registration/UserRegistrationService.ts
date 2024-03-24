import { IAccountService } from 'interfaces/IAccountService';
import { ICategoryService } from 'interfaces/ICategoryService';
import { IUserService } from 'interfaces/IUserService';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IGroupService } from 'interfaces/IGroupService';
import { LanguageType } from 'types/LanguageType';
import { IIncomeService } from 'interfaces/IIncomeService';
import { IMailService } from 'interfaces/IMailService';
import { IMailTemplateService } from 'interfaces/IMailTemplateService';
import { IEmailConfirmationService } from 'interfaces/IEmailConfirmationService';
import { IUser } from 'interfaces/IUser';
import { ErrorCode } from 'types/ErrorCode';
import { IProfileService } from 'interfaces/IProfileService';
import { IProfile } from 'interfaces/IProfile';
import { RoleType } from 'types/RoleType';
import { IAuthService } from 'interfaces/IAuthService';

const preMadeData = require(`../../config/create_user_initial`);
const Success = require('../../utils/success/Success');
const Failure = require('../../utils/failure/Failure');
const TranslationLoaderImpl = require('../translations/TranslationLoaderImpl');
const Translations = require('../translations/Translations');
const AuthService = require('../auth/AuthService');

interface IDefaultData {
    group: string;
    income: string[];
    accounts: string[];
    categories: string[];
}

module.exports = class UserRegistrationService extends LoggerBase {
    protected userService: IUserService;
    protected accountService: IAccountService;
    protected categoryService: ICategoryService;
    protected groupService: IGroupService;
    protected incomeService: IIncomeService;
    protected mailService: IMailService;
    protected mailTemplateService: IMailTemplateService;
    protected emailConfirmationService: IEmailConfirmationService;
    protected profileService: IProfileService;

    constructor(services: {
        userService: IUserService;
        accountService: IAccountService;
        categoryService: ICategoryService;
        groupService: IGroupService;
        incomeService: IIncomeService;
        mailService: IMailService;
        mailTemplateService: IMailTemplateService;
        emailConfirmationService: IEmailConfirmationService;
        profileService: IProfileService;
    }) {
        super();
        this.userService = services.userService;
        this.accountService = services.accountService;
        this.categoryService = services.categoryService;
        this.groupService = services.groupService;
        this.incomeService = services.incomeService;
        this.mailService = services.mailService;
        this.mailTemplateService = services.mailTemplateService;
        this.emailConfirmationService = services.emailConfirmationService;
        this.profileService = services.profileService;
    }

    private getTranslatedDefaultData(language: LanguageType = LanguageType.US): IDefaultData {
        return preMadeData[language];
    }

    async createUser(
        email: string,
        password: string,
        locale: LanguageType = LanguageType.US,
    ): Promise<ISuccess<{ user: IUser; token: string }> | IFailure> {
        try {
            const otherUser = await this.userService.getUserByEmail(email);
            if (otherUser) {
                return new Failure('user already exists', ErrorCode.EMAIL_ALREADY_EXIST);
            }
            const user = await this.userService.createUser(email, password);
            if (user) {
                await Translations.load(locale, TranslationLoaderImpl.instance());
                const newToken = AuthService.createJWToken(user.userId, RoleType.Default);
                await Promise.all([
                    await this.emailConfirmationService.sendConfirmationMail(user.userId, user.email),
                    await this.profileService.createProfile(user.userId, locale),
                ]);
                return new Success({ user, token: newToken });
            } else {
                return new Failure('user not created', ErrorCode.SIGNUP);
            }
        } catch (e) {
            return new Failure('user not created error: ' + e, ErrorCode.SIGNUP);
        }
    }

    async createUserInitialData(user: IUser, profile: IProfile): Promise<ISuccess<IUser> | IFailure> {
        try {
            const { currencyId, locale } = profile;
            const translatedDefaultData = this.getTranslatedDefaultData(locale);
            await Promise.all([
                await this.groupService.createGroup(user.userId, translatedDefaultData.group),
                await this.incomeService.createIncomes(
                    user.userId,
                    translatedDefaultData.income.map((incomeName) => ({
                        incomeName,
                        currencyId,
                    })),
                ),
                await this.accountService.createAccounts(
                    user.userId,
                    translatedDefaultData.accounts.map((accountName: string) => ({
                        accountName,
                        amount: 0,
                        currencyId,
                    })),
                ),
                await this.categoryService.createCategories(
                    user.userId,
                    translatedDefaultData.categories.map((categoryName: string) => ({
                        categoryName,
                        currencyId,
                    })),
                ),
            ]);
            return new Success();
        } catch (e) {
            this._logger.info('failed create initial user data error: ' + e);
            return new Failure(ErrorCode.SIGNUP_INITIAL);
        }
    }
};
