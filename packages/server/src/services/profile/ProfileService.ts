import { IProfilePatchRequest } from '@tenpercent/shared';

import { ICreateProfile } from 'interfaces/ICreateProfile';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IProfile } from 'interfaces/IProfile';
import { IProfileWithEmail } from 'interfaces/IProfileWithEmail';
import { IEmailChangingService } from 'services/emailChanging/EmailChangingService';
import { IPasswordChangingService } from 'services/passwordChanging/PasswordChangingService';
import { IProfileDataAccess } from 'services/profile/ProfileDataAccess';
import { LoggerBase } from 'src/helper/logger/LoggerBase';

export interface IProfileService {
    post(data: ICreateProfile, trx?: IDBTransaction): Promise<IProfile | undefined>;
    get(userId: number, trx?: IDBTransaction): Promise<IProfileWithEmail | undefined>;
    patch(userId: number, properties: Partial<IProfilePatchRequest>, trx?: IDBTransaction): Promise<boolean | undefined>;
    requestEmailChange(
        userId: number,
        newEmail: string,
        trx?: IDBTransaction,
    ): Promise<{ confirmationCode: number; expiresAt: Date }>;
    confirmEmailChange(userId: number, email: string, confirmationCode: number, trx?: IDBTransaction): Promise<boolean>;
    refreshConfirmationCodeForEmailChange(userId: number, newEmail: string, confirmationId: number): Promise<boolean>;
    requestPasswordChange(
        userId: number,
        password: string,
        trx?: IDBTransaction,
    ): Promise<{ confirmationCode: number; expiresAt: Date }>;
    verifyPasswordChangeCode(userId: number, confirmationCode: number): Promise<boolean>;
    applyPasswordChange(userId: number, confirmationCode: number, newPassword: string): Promise<boolean>;
    refreshConfirmationCodeForPasswordChange(userId: number, confirmationCode: number): Promise<boolean>;
    getUserCurrencyCode(userId: number): Promise<string>;
}

export default class ProfileService extends LoggerBase implements IProfileService {
    private readonly _profileDataAccess: IProfileDataAccess;
    private readonly _emailChangingService: IEmailChangingService;
    private readonly _passwordChangingService: IPasswordChangingService;

    public constructor(
        profileDataAccess: IProfileDataAccess,
        emailChangingService: IEmailChangingService,
        passwordChangingService: IPasswordChangingService,
    ) {
        super();
        this._profileDataAccess = profileDataAccess;
        this._emailChangingService = emailChangingService;
        this._passwordChangingService = passwordChangingService;
    }

    public async post(data: ICreateProfile, trx?: IDBTransaction): Promise<IProfile | undefined> {
        return await this._profileDataAccess.post(data, trx);
    }

    public async get(userId: number, trx?: IDBTransaction): Promise<IProfileWithEmail | undefined> {
        return await this._profileDataAccess.get(userId, trx);
    }

    public async patch(
        userId: number,
        properties: Partial<IProfilePatchRequest>,
        trx?: IDBTransaction,
    ): Promise<boolean | undefined> {
        return await this._profileDataAccess.patch(userId, properties, trx);
    }

    public async requestEmailChange(
        userId: number,
        newEmail: string,
        trx?: IDBTransaction,
    ): Promise<{ confirmationCode: number; expiresAt: Date; id: number }> {
        return await this._emailChangingService.request(userId, newEmail, trx);
    }

    public async confirmEmailChange(
        userId: number,
        email: string,
        confirmationCode: number,
        trx?: IDBTransaction,
    ): Promise<boolean> {
        return await this._emailChangingService.confirm(userId, email, confirmationCode, trx);
    }
    public async refreshConfirmationCodeForEmailChange(userId: number, newEmail: string): Promise<boolean> {
        return await this._emailChangingService.refresh(userId, newEmail);
    }

    public async requestPasswordChange(userId: number, password: string): Promise<{ confirmationCode: number; expiresAt: Date }> {
        return await this._passwordChangingService.request(userId, password);
    }

    public async verifyPasswordChangeCode(userId: number, confirmationCode: number): Promise<boolean> {
        return await this._passwordChangingService.verifyCode(userId, confirmationCode);
    }

    public async applyPasswordChange(userId: number, confirmationCode: number, newPassword: string): Promise<boolean> {
        return await this._passwordChangingService.apply(userId, confirmationCode, newPassword);
    }
    public async refreshConfirmationCodeForPasswordChange(userId: number, confirmationId: number): Promise<boolean> {
        return await this._passwordChangingService.refresh(userId, confirmationId);
    }
    public async getUserCurrencyCode(userId: number): Promise<string> {
        const profile = await this.get(userId);
        if (!profile) {
            throw new Error(`Profile not found for userId: ${userId}`);
        }
        return profile.currencyCode;
    }
}
