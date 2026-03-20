import { IUserService } from 'interfaces/IUserService';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IGroupService } from 'interfaces/IGroupService';
import {
    AccountIcon,
    ErrorCode,
    HttpCode,
    ICurrency,
    IncomeIcon,
    LanguageType,
    RoleType,
    SpendIcon,
    UserStatus,
    Utils,
} from 'tenpercent/shared';
import { IMailService } from 'interfaces/IMailService';
import { IMailTemplateService } from 'interfaces/IMailTemplateService';
import { IEmailConfirmationService } from 'interfaces/IEmailConfirmationService';
import { IUser } from 'interfaces/IUser';
import { IProfileService } from 'interfaces/IProfileService';
import TranslationsUtils from 'src/services/translations/TranslationsUtils';
import Translations from 'src/services/translations/Translations';
import TranslationLoaderImpl from 'src/services/translations/TranslationLoaderImpl';
import AuthService from 'src/services/auth/AuthService';
import { IUserRoleService } from 'interfaces/IUserRoleService';
import { ICurrencyService } from 'interfaces/ICurrencyService';
import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { UnitOfWork } from 'src/repositories/UnitOfWork';
import { IProfile } from 'interfaces/IProfile';
import { user_initial } from 'src/config/user_initial';
import currency_initial from 'src/config/currency_initial';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { CustomError } from 'src/utils/errors/CustomError';
import { IBalanceService } from 'interfaces/IBalanceService';
import { IKeyValueStore } from 'src/repositories/keyValueStore/KeyValueStore';
import { getConfig } from 'src/config/config';
import { IAccountService } from 'services/account/AccountService';
import { ICategoryService } from 'services/category/CategoryService';
import { IIncomeService } from 'services/income/IncomeService';

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

    protected balanceService: IBalanceService;

    protected keyValueStore: IKeyValueStore;

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
        balanceService: IBalanceService;
        keyValueStore: IKeyValueStore;
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
        this.balanceService = services.balanceService;
        this.keyValueStore = services.keyValueStore;
        this.db = services.db;
    }

    private getTranslatedDefaultData(language: LanguageType = LanguageType.US): IDefaultData {
        return user_initial[language] ?? user_initial[LanguageType.US];
    }

    public async createUser(
        email: string,
        password: string,
        localeFromUser: LanguageType = LanguageType.US,
        publicName: string,
        currencyCode: string,
    ): Promise<{ user: IUser; token: string; longToken: string }> {
        const uow = new UnitOfWork(this.db);

        try {
            await uow.start();
            const getCurrency = async (): Promise<ICurrency | undefined> => {
                try {
                    if (Utils.isNotNull(currencyCode)) {
                        const currency = await this.currencyService.getByCurrencyCode(currencyCode);
                        if (Utils.isNull(currency)) throw new Error('Currency not found.');
                        return currency;
                    }
                } catch {
                    const currencyCode = (currency_initial[locale] ?? currency_initial[LanguageType.US]).currencyCode;
                    return await this.currencyService.getByCurrencyCode(currencyCode);
                }
            };
            const locale = TranslationsUtils.convertToSupportLocale(localeFromUser);
            const otherUser = await this.userService.getUserAuthenticationData(email);
            if (otherUser) {
                throw new ValidationError({
                    message: 'A user with this email already exists',
                    errorCode: ErrorCode.SIGNUP_USER_ALREADY_EXISTS_ERROR,
                });
            }
            const trxInProcess = uow.getTransaction();
            if (Utils.isNull(trxInProcess)) {
                throw new CustomError({
                    message: 'Transaction not initiated. User could not be created',
                    errorCode: ErrorCode.TRANSACTION_ERROR,
                    statusCode: HttpCode.INTERNAL_SERVER_ERROR,
                });
            }
            const trx = trxInProcess as unknown as IDBTransaction;
            const user = await this.userService.create(email, password, trx);
            const currency = await getCurrency();
            if (user) {
                if (!currency) {
                    throw new CustomError({
                        message: 'Unable to retrieve the user’s currency based on their locale.',
                        statusCode: HttpCode.INTERNAL_SERVER_ERROR,
                        errorCode: ErrorCode.SESSION_CREATE_ERROR,
                    });
                }
                await Translations.load(locale, TranslationLoaderImpl.instance());

                const response = await Promise.all([
                    await this.userRoleService.createUserRole(user.userId, RoleType.Default, trx),
                    await this.profileService.post(
                        {
                            userId: user.userId,
                            currencyId: currency.currencyId,
                            locale,
                            publicName,
                        },
                        trx,
                    ),
                    await this.emailConfirmationService.createEmailConfirmation(user.userId, user.email, trx),
                ]);
                if (Utils.isNull(response[1]?.profileId)) {
                    throw new CustomError({
                        message: 'User profile creation failed during the registration process.',
                        statusCode: HttpCode.INTERNAL_SERVER_ERROR,
                        errorCode: ErrorCode.SIGNUP_PROFILE_NOT_CREATED_ERROR,
                    });
                }
                await this.balanceService.post(user.userId, { amount: 0, currencyCode: currency.currencyCode }, trx);
                const profile = response[1] as IProfile;
                await this.createInitialDataForNewUser(user.userId, profile, trx);
                await uow.commit();
                this.emailConfirmationService.sendConfirmationEmail(user.userId, user.email, response[2]).catch((e) => {
                    this._logger.error(
                        `User creation confirmation mail send failed due reason: ${(e as { message: string }).message}`,
                    );
                });
                const readyUser = await this.userService.get(user.userId);
                this._logger.info('Starting token creation.');
                const token = AuthService.createJWToken(
                    user.userId,
                    RoleType.Default,
                    getConfig().jwtSecret,
                    getConfig().jwtExpiresIn,
                );
                const longToken = AuthService.createJWToken(
                    user.userId,
                    RoleType.Default,
                    getConfig().jwtLongSecret,
                    getConfig().jwtLongExpiresIn,
                );
                this._logger.info('Token created successfully.');
                return { user: readyUser, token, longToken };
            }
            throw new CustomError({
                message: 'User could not be created due to an unknown error.',
                statusCode: HttpCode.INTERNAL_SERVER_ERROR,
                errorCode: ErrorCode.SIGNUP_CATCH_ERROR,
            });
        } catch (e) {
            await uow.rollback();
            this._logger.error(`User creation failed due to a server error: ${(e as { message: string }).message}`);
            throw e;
        }
    }

    async confirmUserMail(userId: number, email: string, code: number): Promise<void> {
        const uow = new UnitOfWork(this.db);

        try {
            await uow.start();
            const trxInProcess = uow.getTransaction();
            if (Utils.isNull(trxInProcess)) {
                throw new CustomError({
                    message: "Transaction not initiated. User email can't not be confirmed",
                    errorCode: ErrorCode.TRANSACTION_ERROR,
                    statusCode: HttpCode.INTERNAL_SERVER_ERROR,
                });
            }
            const trx = trxInProcess as unknown as IDBTransaction;
            await this.emailConfirmationService.confirmEmail(userId, email, code, trx);
            await this.userService.patch(userId, { status: UserStatus.ACTIVE }, trx);
            await uow.commit();
        } catch (e) {
            await uow.rollback();
            this._logger.info(`User  mail confirmation failed due to a server error: ${(e as { message: string }).message}`);
            throw e;
        }
    }

    private async createInitialDataForNewUser(userId: number, profile: IProfile, trx: IDBTransaction): Promise<boolean> {
        try {
            const translatedDefaultData = this.getTranslatedDefaultData(profile?.locale);
            const incomesIcons = [IncomeIcon.BNB, IncomeIcon.P2P];
            const accountIcons = [AccountIcon.Cash, AccountIcon.BankCard];
            const categoryIcons = [
                SpendIcon.ShoppingCart, // Food
                SpendIcon.Store, // Housing
                SpendIcon.ShoppingBag, // Transport
                SpendIcon.ShoppingBag2, // Health and Medicine
                SpendIcon.ShoppingBag3, // Education
                SpendIcon.ShoppingBag4, // Entertainment
                SpendIcon.ShoppingBasket, // Leisure and Travel
                SpendIcon.PriceTag, // Clothing and Accessories
                SpendIcon.PriceTag2, // Communication and Internet
                SpendIcon.Gift, // Gifts and Charity
                SpendIcon.Coupon, // Personal Expenses
                SpendIcon.Store2, // Savings and Investments
            ];
            await Promise.all([
                await this.groupService.createGroup(userId, translatedDefaultData.group, trx),
                await this.incomeService.creates(
                    userId,
                    translatedDefaultData.income.map((incomeName, index) => ({
                        incomeName,
                        currencyId: profile.currencyId,
                        iconId: incomesIcons[index],
                    })),
                    trx,
                ),
                await this.accountService.createAccounts(
                    userId,
                    translatedDefaultData.accounts.map((accountName: string, index: number) => ({
                        accountName,
                        amount: 0,
                        currencyId: profile.currencyId,
                        iconId: accountIcons[index],
                    })),
                    trx,
                ),
                await this.categoryService.creates(
                    userId,
                    translatedDefaultData.categories.map((categoryName: string, index: number) => ({
                        categoryName,
                        currencyId: profile.currencyId,
                        iconId: categoryIcons[index] ?? SpendIcon.ShoppingBag,
                    })),
                    trx,
                ),
            ]);
            return true;
        } catch (e) {
            this._logger.info(`Failed create initial user data error: ${e}`, ErrorCode.SIGNUP_CREATE_INITIAL_DATA_ERROR);
            throw e;
        }
    }
}
