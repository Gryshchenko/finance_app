import { IProfileDataAccess } from 'interfaces/IProfileDataAccess';
import { IProfileService } from 'interfaces/IProfileService';
import { IProfile } from 'interfaces/IProfile';
import { LanguageType } from 'types/LanguageType';
import { ErrorCode } from 'types/ErrorCode';
import { IEmailConfirmationDataAccess } from 'interfaces/IEmailConfirmationDataAccess';
import { IMailService } from 'interfaces/IMailService';
import { IMailTemplateService } from 'interfaces/IMailTemplateService';
import { IUserService } from 'interfaces/IUserService';
import { LoggerBase } from 'src/helper/logger/LoggerBase';

const Success = require('../../utils/success/Success');
const Failure = require('../../utils/failure/Failure');

module.exports = class ProfileService extends LoggerBase implements IProfileService {
    private _profileDataAccess: IProfileDataAccess;
    protected emailConfirmationDataAccess: IEmailConfirmationDataAccess;
    protected mailService: IMailService;
    protected mailTemplateService: IMailTemplateService;
    protected userService: IUserService;

    public constructor(
        profileDataAccess: IProfileDataAccess,
        emailConfirmationDataAccess: IEmailConfirmationDataAccess,
        emailService: IMailService,
        mailTemplateService: IMailTemplateService,
        userService: IUserService,
    ) {
        super();
        this.emailConfirmationDataAccess = emailConfirmationDataAccess;
        this.mailService = emailService;
        this.mailTemplateService = mailTemplateService;
        this.userService = userService;
        this._profileDataAccess = profileDataAccess;
    }
    async createProfile(userId: number, locale: LanguageType): Promise<IProfile> {
        return await this._profileDataAccess.createProfile(userId, locale);
    }
    async getProfile(userId: number): Promise<IProfile | undefined> {
        return await this._profileDataAccess.getProfile(userId);
    }
    public async proceedMailConfirmationCode(
        userId: number,
        newEmail: string,
        code: number,
        originEmail: string,
    ): Promise<ISuccess<unknown> | IFailure> {
        // try {
        //     const userConfirmationData = await this.emailConfirmationDataAccess.getUserConfirmation(userId, newEmail);
        //     if (!userConfirmationData || userConfirmationData.confirmationCode !== code) {
        //         return new Failure('Confirmation code not same', ErrorCode.EMAIL_VERIFICATION_CODE_INVALID);
        //     }
        //     await this.emailConfirmationDataAccess.confirmUserMail({
        //         userId,
        //         email: newEmail,
        //         confirmationId: userConfirmationData.confirmationId,
        //     });
        //     if (newEmail !== originEmail) {
        //         await this.userService.updateUserEmail(userId, userConfirmationData.email);
        //     }
        return new Success();
        // } catch (error) {
        //     return new Failure(error, ErrorCode.EMAIL_VERIFICATION_CODE_INVALID, false);
        // }
    }
};
