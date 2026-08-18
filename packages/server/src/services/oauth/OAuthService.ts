import { ErrorCode, HttpCode, LanguageType, RoleType } from '@tenpercent/shared';

import { IUser } from 'interfaces/IUser';
import AuthService from 'services/auth/AuthService';
import { IOAuthDataAccess } from 'services/oauth/OAuthDataAccess';
import { IOAuthProvider, OAuthProviderType } from 'services/oauth/providers/IOAuthProvider';
import { IUserService } from 'services/user/UserService';
import { getConfig } from 'src/config/config';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import UserRegistrationService from 'src/services/registration/UserRegistrationService';
import { CustomError } from 'src/utils/errors/CustomError';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { maskEmail } from 'src/utils/maskPII';

export interface IOAuthResult {
    user: IUser;
    token: string;
    longToken: string;
    isNewUser: boolean;
}

export interface IOAuthService {
    authenticate(
        provider: OAuthProviderType,
        idToken: string,
        locale?: LanguageType,
        publicName?: string,
        currencyCode?: string,
    ): Promise<IOAuthResult>;
}

export default class OAuthService extends LoggerBase implements IOAuthService {
    private readonly _providers: Map<OAuthProviderType, IOAuthProvider>;
    private readonly _oauthDataAccess: IOAuthDataAccess;
    private readonly _userService: IUserService;
    private readonly _registrationService: UserRegistrationService;

    constructor(services: {
        providers: Map<OAuthProviderType, IOAuthProvider>;
        oauthDataAccess: IOAuthDataAccess;
        userService: IUserService;
        registrationService: UserRegistrationService;
    }) {
        super();
        this._providers = services.providers;
        this._oauthDataAccess = services.oauthDataAccess;
        this._userService = services.userService;
        this._registrationService = services.registrationService;
    }

    public async authenticate(
        provider: OAuthProviderType,
        idToken: string,
        locale: LanguageType = LanguageType.US,
        publicName?: string,
        currencyCode?: string,
    ): Promise<IOAuthResult> {
        const oauthProvider = this._providers.get(provider);
        if (!oauthProvider) {
            throw new ValidationError({
                message: `Unsupported OAuth provider: ${provider}`,
                errorCode: ErrorCode.AUTH_ERROR,
                statusCode: HttpCode.BAD_REQUEST,
                payload: { field: 'provider', reason: 'unsupported' },
            });
        }

        this._logger.info(`OAuth authentication started for provider: ${provider}`);

        // 1. Verify idToken with provider
        const userInfo = await oauthProvider.verify(idToken);
        this._logger.info(`OAuth token verified for provider: ${provider}, email: ${maskEmail(userInfo.email)}`);

        // 2. Check if OAuth link already exists → login
        const existingLink = await this._oauthDataAccess.findByProviderId(provider, userInfo.providerId);
        if (existingLink) {
            this._logger.info(`Existing OAuth link found, userId: ${existingLink.userId}`);
            return this.loginExistingUser(existingLink.userId);
        }

        // 3. Check if user with this email already exists → link + login
        const existingUserId = await this._userService.getUserIdByMail(userInfo.email);
        if (existingUserId) {
            this._logger.info(`Existing user found by email, linking OAuth. userId: ${existingUserId}`);
            await this._oauthDataAccess.create(existingUserId, provider, userInfo.providerId, userInfo.email);
            return this.loginExistingUser(existingUserId);
        }

        // 4. New user → register + link
        this._logger.info(`New OAuth user, creating account for email: ${maskEmail(userInfo.email)}`);
        return this.registerNewUser(provider, userInfo, locale, publicName, currencyCode);
    }

    private async loginExistingUser(userId: number): Promise<IOAuthResult> {
        const user = await this._userService.get(userId);

        if (!user?.userId) {
            throw new CustomError({
                message: `OAuth linked user not found: ${userId}`,
                errorCode: ErrorCode.AUTH_ERROR,
                statusCode: HttpCode.INTERNAL_SERVER_ERROR,
            });
        }

        const token = AuthService.createJWToken(user.userId, RoleType.Default, getConfig().jwtSecret, getConfig().jwtExpiresIn);
        const longToken = AuthService.createJWToken(
            user.userId,
            RoleType.Default,
            getConfig().jwtLongSecret,
            getConfig().jwtLongExpiresIn,
            'refresh',
        );

        this._logger.info(`OAuth login successful for userId: ${user.userId}`);
        return { user, token, longToken, isNewUser: false };
    }

    private async registerNewUser(
        provider: OAuthProviderType,
        userInfo: { providerId: string; email: string; emailVerified: boolean },
        locale: LanguageType,
        publicName?: string,
        currencyCode?: string,
    ): Promise<IOAuthResult> {
        const name = publicName || userInfo.email.split('@')[0];
        const currency = currencyCode || 'USD';

        const { user, token, longToken } = await this._registrationService.createOAuthUser(
            userInfo.email,
            locale,
            name,
            currency,
            userInfo.emailVerified,
        );

        await this._oauthDataAccess.create(user.userId, provider, userInfo.providerId, userInfo.email);

        this._logger.info(`OAuth registration successful for userId: ${user.userId}`);
        return { user, token, longToken, isNewUser: true };
    }
}
