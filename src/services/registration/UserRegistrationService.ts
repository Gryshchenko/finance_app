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
import { RoleType } from 'types/RoleType';
import { IFailure } from 'interfaces/IFailure';
import { ISuccess } from 'interfaces/ISuccess';
import Failure from 'src/utils/failure/Failure';
import TranslationsUtils from 'src/services/translations/TranslationsUtils';
import Translations from 'src/services/translations/Translations';
import TranslationLoaderImpl from 'src/services/translations/TranslationLoaderImpl';
import AuthService from 'src/services/auth/AuthService';
import Success from 'src/utils/success/Success';
import { IUserRoleService } from 'interfaces/IUserRoleService';
import CurrencyUtils from 'src/utils/СurrencyUtils';
import { ICurrencyService } from 'interfaces/ICurrencyService';

const preMadeData = require('../../config/create_user_initial');

interface IDefaultData {
    group: string;
    income: string[];
    accounts: string[];
    categories: string[];
}

export default class UserRegistrationService extends LoggerBase {
    protected userService: IUserService;

    protected accountService: IAccountService;

    protected categoryService: ICategoryService;

    protected groupService: IGroupService;

    protected incomeService: IIncomeService;

    protected mailService: IMailService;

    protected mailTemplateService: IMailTemplateService;

    protected emailConfirmationService: IEmailConfirmationService;

    protected profileService: IProfileService;

    protected userRoleService: IUserRoleService;

    protected currencyService: ICurrencyService;

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
        userRoleService: IUserRoleService;
        currencyService: ICurrencyService;
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
        this.userRoleService = services.userRoleService;
        this.currencyService = services.currencyService;
    }

    private getTranslatedDefaultData(language: LanguageType = LanguageType.US): IDefaultData {
        return preMadeData[language];
    }

    public async createUser(
        email: string,
        password: string,
        localeFromUser: LanguageType = LanguageType.US,
    ): Promise<ISuccess<{ user: IUser; token: string }> | IFailure> {
        try {
            const locale = TranslationsUtils.convertToSupportLocale(localeFromUser);
            const otherUser = await this.userService.getUserAuthenticationData(email);
            if (otherUser) {
                return new Failure('user already exists', ErrorCode.SIGNUP);
            }
            const user = await this.userService.createUser(email, password);
            if (user) {
                const currencyCode =
                    CurrencyUtils.getCurrencyCodeFromLocale(locale, CurrencyUtils.getCurrencyForLocale(locale)) ??
                    CurrencyUtils.defaultCurrencyCode;
                const currency = await this.currencyService.getCurrencyByCurrencyCode(currencyCode);
                if (!currency) {
                    return new Failure('cant get currency for new user', ErrorCode.SIGNUP);
                }
                await Translations.load(locale, TranslationLoaderImpl.instance());
                const newToken = AuthService.createJWToken(user.userId, RoleType.Default);

                await Promise.all([
                    await this.userRoleService.createUserRole(user.userId, RoleType.Default),
                    await this.emailConfirmationService.sendConfirmationMail(user.userId, user.email),
                    await this.profileService.createProfile({
                        userId: user.userId,
                        currencyId: currency.currencyId,
                        locale,
                    }),
                ]);
                const readyUser = await this.userService.getUser(user.userId);
                return new Success({ user: readyUser, token: newToken });
            }
            return new Failure('user not created', ErrorCode.SIGNUP);
        } catch (e) {
            return new Failure(`user not created error: ${JSON.stringify(e)}`, ErrorCode.SIGNUP);
        }
    }

    async confirmUserMail(userId: number, code: number): Promise<ISuccess<IUser> | IFailure> {
        try {
            const userConfirmationData = await this.emailConfirmationService.getUserConfirmation(userId, code);
            if (!userConfirmationData || userConfirmationData.confirmationCode !== code) {
                return new Failure('Confirmation code not same', ErrorCode.EMAIL_VERIFICATION_CODE_INVALID);
            }
            await this.profileService.confirmationUserMail(userId);
            const user = await this.userService.updateUserEmail(userId, userConfirmationData.email);
            await this.emailConfirmationService.deleteUserConfirmation(userId, userConfirmationData.confirmationCode);
            return new Success(user);
        } catch (error) {
            return new Failure(String(error), ErrorCode.EMAIL_VERIFICATION_CODE_INVALID, false);
        }
    }

    async createInitialDataForNewUser(userId: number, currencyId: number): Promise<ISuccess<IUser> | IFailure> {
        try {
            const profile = await this.profileService.getProfile(userId);
            if (!profile) {
                this._logger.info('cant find profile');
                return new Failure('cant find profile', ErrorCode.SIGNUP_INITIAL);
            }
            const translatedDefaultData = this.getTranslatedDefaultData(profile?.locale);
            await Promise.all([
                await this.groupService.createGroup(userId, translatedDefaultData.group),
                await this.incomeService.createIncomes(
                    userId,
                    translatedDefaultData.income.map((incomeName) => ({
                        incomeName,
                        currencyId,
                    })),
                ),
                await this.accountService.createAccounts(
                    userId,
                    translatedDefaultData.accounts.map((accountName: string) => ({
                        accountName,
                        amount: 0,
                        currencyId,
                    })),
                ),
                await this.categoryService.createCategories(
                    userId,
                    translatedDefaultData.categories.map((categoryName: string) => ({
                        categoryName,
                        currencyId,
                    })),
                ),
            ]);
            // @ts-ignore
            return new Success(undefined);
        } catch (e) {
            this._logger.info(`failed create initial user data error: ${e}`);
            return new Failure(`failed create initial user data error: ${e}`, ErrorCode.SIGNUP_INITIAL);
        }
    }
}
