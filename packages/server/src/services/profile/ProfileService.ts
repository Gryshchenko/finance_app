import { IProfilePatchRequest } from 'tenpercent/shared';

import { ICreateProfile } from 'interfaces/ICreateProfile';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IProfile } from 'interfaces/IProfile';
import { IEmailChangingService } from 'services/emailChanging/EmailChangingService';
import { IPasswordChangingService } from 'services/passwordChanging/PasswordChangingService';
import { IProfileDataAccess } from 'services/profile/ProfileDataAccess';
import { LoggerBase } from 'src/helper/logger/LoggerBase';

export interface IProfileService {
    post(data: ICreateProfile, trx?: IDBTransaction): Promise<IProfile | undefined>;
    get(userId: number, trx?: IDBTransaction): Promise<IProfile | undefined>;
    patch(userId: number, properties: Partial<IProfilePatchRequest>, trx?: IDBTransaction): Promise<boolean | undefined>;
    requestEmailChange(
        userId: number,
        newEmail: string,
        trx?: IDBTransaction,
    ): Promise<{ confirmationCode: number; expiresAt: Date }>;
    confirmEmailChange(userId: number, confirmationCode: number, trx?: IDBTransaction): Promise<boolean>;
    requestPasswordChange(
        userId: number,
        newPassword: string,
        password: string,
        trx?: IDBTransaction,
    ): Promise<{ confirmationCode: number; expiresAt: Date }>;
    confirmPasswordChange(userId: number, confirmationCode: number, trx?: IDBTransaction): Promise<boolean>;
    refreshConfirmationCodeForPasswordChange(userId: number, confirmationCode: number): Promise<boolean>;
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

    public async get(userId: number, trx?: IDBTransaction): Promise<IProfile | undefined> {
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
    ): Promise<{ confirmationCode: number; expiresAt: Date }> {
        return await this._emailChangingService.request(userId, newEmail, trx);
    }

    public async confirmEmailChange(userId: number, confirmationCode: number, trx?: IDBTransaction): Promise<boolean> {
        return await this._emailChangingService.confirm(userId, confirmationCode, trx);
    }

    public async requestPasswordChange(
        userId: number,
        newPassword: string,
        password: string,
    ): Promise<{ confirmationCode: number; expiresAt: Date }> {
        return await this._passwordChangingService.request(userId, newPassword, password);
    }

    public async confirmPasswordChange(userId: number, confirmationCode: number): Promise<boolean> {
        return await this._passwordChangingService.confirm(userId, confirmationCode);
    }
    public async refreshConfirmationCodeForPasswordChange(userId: number, confirmationId: number): Promise<boolean> {
        return await this._passwordChangingService.refresh(userId, confirmationId);
    }
    public async refreshConfirmationCodeForEmailChange(userId: number, confirmationId: number): Promise<boolean> {
        return await this._passwordChangingService.refresh(userId, confirmationId);
    }
}
