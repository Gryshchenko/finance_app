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
import { ICurrencyService } from 'interfaces/ICurrencyService';
import { IDatabaseConnection, ITransaction } from 'interfaces/IDatabaseConnection';
import { UnitOfWork } from 'src/repositories/UnitOfWork';
import Utils from 'src/utils/Utils';
import { IProfile } from 'interfaces/IProfile';
import { user_initial } from 'src/config/user_initial';
import currency_initial from 'src/config/currency_initial';
import { ICreateUser } from 'interfaces/ICreateUser';

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
    protected db: IDatabaseConnection;

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
        db: IDatabaseConnection;
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
        this.db = services.db;
    }

    private getTranslatedDefaultData(language: LanguageType = LanguageType.US): IDefaultData {
        return user_initial[language] ?? user_initial[LanguageType.US];
    }

    public async createUser(
        email: string,
        password: string,
        localeFromUser: LanguageType = LanguageType.US,
    ): Promise<ISuccess<{ user: IUser; token: string }> | IFailure> {
        const uow = new UnitOfWork(this.db);

        try {
            await uow.start();
            const locale = TranslationsUtils.convertToSupportLocale(localeFromUser);
            const otherUser = await this.userService.getUserAuthenticationData(email);
            if (otherUser) {
                return new Failure('A user with this email already exists', ErrorCode.SIGNUP_USER_ALREADY_EXIST);
            }
            const trxInProcess = uow.getTransaction();
            if (Utils.isNull(trxInProcess)) {
                return new Failure('Transaction not initiated. User could not be created', ErrorCode.SIGNUP_TRANSACTION);
            }
            const trx = trxInProcess as unknown as ITransaction;
            const createUserResult = await this.userService.createUser(email, password, trx);
            if (createUserResult instanceof Failure) {
                throw new Error(createUserResult.error);
            }
            const user = (createUserResult as ISuccess<ICreateUser>).value;
            if (user) {
                const currencyCode = (currency_initial[locale] ?? currency_initial[LanguageType.US]).currencyCode;
                const currency = await this.currencyService.getCurrencyByCurrencyCode(currencyCode);
                if (!currency) {
                    return new Failure('Unable to retrieve the user’s currency based on their locale.', ErrorCode.SIGNUP_CAN_GET_CURRENCY);
                }
                await Translations.load(locale, TranslationLoaderImpl.instance());
                this._logger.info('Starting token creation.');
                const newToken = AuthService.createJWToken(user.userId, RoleType.Default);
                this._logger.info('Token created successfully.');

                const response = await Promise.all([
                    await this.userRoleService.createUserRole(user.userId, RoleType.Default, trx),
                    await this.profileService.createProfile(
                        {
                            userId: user.userId,
                            currencyId: currency.currencyId,
                            locale,
                        },
                        trx,
                    ),
                    await this.emailConfirmationService.createConfirmationMail(user.userId, user.email, trx),
                ]);
                if (Utils.isNull(response[1]?.userId)) {
                    return new Failure('User profile creation failed during the registration process.', ErrorCode.SIGNUP_PROFILE_NOT_CREATED);
                }
                const profile = response[1] as IProfile;
                await this.createInitialDataForNewUser(user.userId, profile, trx);
                await uow.commit();
                await this.emailConfirmationService.sendConfirmationMailToUser(user.userId, user.email);
                const readyUser = await this.userService.getUser(user.userId);
                return new Success({ user: readyUser, token: newToken });
            }
            return new Failure('User could not be created due to an unknown error.', ErrorCode.SIGNUP_USER_NOT_CREATED);
        } catch (e) {
            await uow.rollback();
            return new Failure(`User creation failed due to a server error: ${JSON.stringify(e)}`, ErrorCode.SIGNUP_CATCH_ERROR);
        }
    }

    async confirmUserMail(userId: number, code: number): Promise<ISuccess<IUser> | IFailure> {
        try {
            const userConfirmationData = await this.emailConfirmationService.getUserConfirmation(userId, code);
            if (!userConfirmationData || userConfirmationData.confirmationCode !== code) {
                return new Failure('Confirmation mail failed due code not same', ErrorCode.EMAIL_VERIFICATION_CODE_INVALID);
            }
            await this.profileService.confirmationUserMail(userId);
            const user = await this.userService.updateUserEmail(userId, userConfirmationData.email);
            await this.emailConfirmationService.deleteUserConfirmation(userId, userConfirmationData.confirmationCode);
            return new Success(user);
        } catch (error) {
            return new Failure(String(error), ErrorCode.EMAIL_VERIFICATION_CODE_INVALID, false);
        }
    }

    private async createInitialDataForNewUser(
        userId: number,
        profile: IProfile,
        trx: ITransaction,
    ): Promise<ISuccess<boolean> | IFailure> {
        try {
            const translatedDefaultData = this.getTranslatedDefaultData(profile?.locale);
            await Promise.all([
                await this.groupService.createGroup(userId, translatedDefaultData.group, trx),
                await this.incomeService.createIncomes(
                    userId,
                    translatedDefaultData.income.map((incomeName) => ({
                        incomeName,
                        currencyId: profile.currencyId,
                    })),
                    trx,
                ),
                await this.accountService.createAccounts(
                    userId,
                    translatedDefaultData.accounts.map((accountName: string) => ({
                        accountName,
                        amount: 0,
                        currencyId: profile.currencyId,
                    })),
                    trx,
                ),
                await this.categoryService.createCategories(
                    userId,
                    translatedDefaultData.categories.map((categoryName: string) => ({
                        categoryName,
                        currencyId: profile.currencyId,
                    })),
                    trx,
                ),
            ]);
            return new Success(true);
        } catch (e) {
            return new Failure(`Failed create initial user data error: ${e}`, ErrorCode.SIGNUP_CREATE_INITIAL_DATA);
        }
    }
}
