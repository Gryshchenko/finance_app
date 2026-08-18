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
} from '@tenpercent/shared';
import cryptoModule from 'crypto';

import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IProfile } from 'interfaces/IProfile';
import { IUser } from 'interfaces/IUser';
import { IAccountService } from 'services/account/AccountService';
import { IBalanceService } from 'services/balance/BalanceService';
import { ICategoryService } from 'services/category/CategoryService';
import { ICurrencyService } from 'services/currency/CurrencyService';
import { IEmailConfirmationService } from 'services/emailConfirmation/EmailConfirmationService';
import { IGroupService } from 'services/group/GroupService';
import { IIncomeService } from 'services/income/IncomeService';
import { IProfileService } from 'services/profile/ProfileService';
import { IUserService } from 'services/user/UserService';
import UserServiceUtils from 'services/user/UserServiceUtils';
import { IUserRoleService } from 'services/userRole/UserRoleService';
import { getConfig } from 'src/config/config';
import currency_initial from 'src/config/currency_initial';
import { user_initial } from 'src/config/user_initial';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IKeyValueStore } from 'src/repositories/keyValueStore/KeyValueStore';
import { UnitOfWork } from 'src/repositories/UnitOfWork';
import AuthService from 'src/services/auth/AuthService';
import TranslationLoaderImpl from 'src/services/translations/TranslationLoaderImpl';
import Translations from 'src/services/translations/Translations';
import TranslationsUtils from 'src/services/translations/TranslationsUtils';
import { CustomError } from 'src/utils/errors/CustomError';
import { ValidationError } from 'src/utils/errors/ValidationError';

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
                // A taken address used to be rejected here immediately, while a free one went on to
                // an argon2 hash costing 64MB and ~100ms. That difference is measurable from outside
                // and answers "is this address registered?" regardless of what the body says. Spending
                // the same work before rejecting closes the timing channel; the response body is still
                // distinguishable, see the note on `signup` in routes/register.ts.
                await UserServiceUtils.hashPassword(password, UserServiceUtils.getRandomSalt());
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
                            currencyCode: currency.currencyCode,
                            locale,
                            publicName,
                        },
                        trx,
                    ),
                    await this.emailConfirmationService.request(user.userId, user.email, trx),
                ]);
                if (Utils.isNull(response[1]?.profileId)) {
                    throw new CustomError({
                        message: 'User profile creation failed during the registration process.',
                        statusCode: HttpCode.INTERNAL_SERVER_ERROR,
                        errorCode: ErrorCode.SIGNUP_PROFILE_NOT_CREATED_ERROR,
                    });
                }
                const profile = response[1] as IProfile;
                await this.createInitialDataForNewUser(user.userId, profile, trx);
                await uow.commit();
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
                    'refresh',
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

    public async createOAuthUser(
        email: string,
        localeFromUser: LanguageType = LanguageType.US,
        publicName: string,
        currencyCode: string,
        emailVerified: boolean,
    ): Promise<{ user: IUser; token: string; longToken: string }> {
        const uow = new UnitOfWork(this.db);

        try {
            await uow.start();
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

            // Generate a random password for OAuth users (they will never use it)
            const randomPassword = cryptoModule.randomBytes(32).toString('hex');
            const user = await this.userService.create(email, randomPassword, trx);

            if (!user) {
                throw new CustomError({
                    message: 'OAuth user could not be created due to an unknown error.',
                    statusCode: HttpCode.INTERNAL_SERVER_ERROR,
                    errorCode: ErrorCode.SIGNUP_CATCH_ERROR,
                });
            }

            const getCurrency = async (): Promise<ICurrency | undefined> => {
                try {
                    if (Utils.isNotNull(currencyCode)) {
                        const currency = await this.currencyService.getByCurrencyCode(currencyCode);
                        if (Utils.isNull(currency)) throw new Error('Currency not found.');
                        return currency;
                    }
                } catch {
                    const code = (currency_initial[locale] ?? currency_initial[LanguageType.US]).currencyCode;
                    return await this.currencyService.getByCurrencyCode(code);
                }
            };

            const currency = await getCurrency();
            if (!currency) {
                throw new CustomError({
                    message: 'Unable to retrieve the user\u2019s currency based on their locale.',
                    statusCode: HttpCode.INTERNAL_SERVER_ERROR,
                    errorCode: ErrorCode.SESSION_CREATE_ERROR,
                });
            }

            await Translations.load(locale, TranslationLoaderImpl.instance());

            // const initialStatus = emailVerified ? UserStatus.ACTIVE : UserStatus.NO_VERIFIED;

            const response = await Promise.all([
                await this.userRoleService.createUserRole(user.userId, RoleType.Default, trx),
                await this.profileService.post(
                    { userId: user.userId, currencyCode: currency.currencyCode, locale, publicName },
                    trx,
                ),
                // ...(emailVerified ? [] : [await this.emailConfirmationService.refresh(user.userId, user.email, trx)]),
            ]);

            if (Utils.isNull(response[1]?.profileId)) {
                throw new CustomError({
                    message: 'User profile creation failed during the registration process.',
                    statusCode: HttpCode.INTERNAL_SERVER_ERROR,
                    errorCode: ErrorCode.SIGNUP_PROFILE_NOT_CREATED_ERROR,
                });
            }

            const profile = response[1] as IProfile;
            await this.createInitialDataForNewUser(user.userId, profile, trx);

            if (emailVerified) {
                await this.userService.patch(user.userId, { status: UserStatus.ACTIVE }, trx);
            }

            await uow.commit();

            const readyUser = await this.userService.get(user.userId);
            this._logger.info('OAuth user created, generating tokens.');

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
                'refresh',
            );

            this._logger.info(`OAuth user registration completed for userId: ${user.userId}`);
            return { user: readyUser, token, longToken };
        } catch (e) {
            await uow.rollback();
            this._logger.error(`OAuth user creation failed: ${(e as { message: string }).message}`);
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
                await this.groupService.createGroup(userId, { groupName: translatedDefaultData.group }, trx),
                await this.incomeService.creates(
                    userId,
                    translatedDefaultData.income.map((incomeName, index) => ({
                        incomeName,
                        currencyCode: profile.currencyCode,
                        iconId: incomesIcons[index],
                    })),
                    trx,
                ),
                await this.accountService.createAccounts(
                    userId,
                    translatedDefaultData.accounts.map((accountName: string, index: number) => ({
                        accountName,
                        amount: 0,
                        currencyCode: profile.currencyCode,
                        iconId: accountIcons[index],
                    })),
                    trx,
                ),
                await this.categoryService.creates(
                    userId,
                    translatedDefaultData.categories.map((categoryName: string, index: number) => ({
                        categoryName,
                        currencyCode: profile.currencyCode,
                        iconId: categoryIcons[index] ?? SpendIcon.ShoppingBag,
                    })),
                    trx,
                ),
            ]);
            return true;
        } catch (e) {
            this._logger.error(
                `Failed to create initial data for userId: ${userId}. Error: ${(e as { message: string }).message}`,
            );
            throw e;
        }
    }
}
