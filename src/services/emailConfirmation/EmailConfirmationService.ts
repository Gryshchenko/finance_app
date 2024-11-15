import { IEmailConfirmationDataAccess } from 'interfaces/IEmailConfirmationDataAccess';
import { IEmailConfirmationService } from 'interfaces/IEmailConfirmationService';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { ErrorCode } from 'types/ErrorCode';
import { IMailService } from 'interfaces/IMailService';
import { IMailTemplateService } from 'interfaces/IMailTemplateService';
import { TranslationKey } from 'types/TranslationKey';
import { IUserService } from 'interfaces/IUserService';
import { IEmailConfirmationData } from 'interfaces/IEmailConfirmationData';
import Translations from 'src/services/translations/Translations';
import TimeManagerUTC from 'src/utils/TimeManagerUTC';
import Utils from 'src/utils/Utils';
import { ITransaction } from 'interfaces/IDatabaseConnection';
import { getConfig } from 'src/config/config';
import { CustomError } from 'src/utils/errors/CustomError';
import { ValidationError } from 'src/utils/errors/ValidationError';

const { randomBytes } = require('crypto');

const CONFIRMATION_MAIL_EXPIRED_TIME = [0, 15, 0];

export default class EmailConfirmationService extends LoggerBase implements IEmailConfirmationService {
    protected emailConfirmationDataAccess: IEmailConfirmationDataAccess;

    protected mailService: IMailService;

    protected mailTemplateService: IMailTemplateService;

    protected userService: IUserService;

    public constructor(
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
    }

    private createConfirmationKey(): number {
        const buffer = randomBytes(4);
        const number = buffer.readUInt32BE(0);
        return Number(number.toString().padStart(8, '0').substring(0, 8));
    }

    private async sendMail(email: string, confirmationCode: number): Promise<unknown> {
        try {
            const response = await this.mailService.sendMail({
                subject: Translations.text(TranslationKey.CONFIRM_MAIL_ADDRESS),
                sender: { mail: String(getConfig().mailNotReply), name: String(getConfig().appName) },
                recipients: [{ mail: email, name: Translations.text(TranslationKey.HELLO_GUEST) }],
                tags: {
                    code: confirmationCode,
                    company: String(getConfig().appName),
                    CONFIRM_MAIL_ADDRESS: Translations.text(TranslationKey.CONFIRM_MAIL_ADDRESS),
                    HELLO_GUEST: Translations.text(TranslationKey.HELLO_GUEST),
                    CONFIRM_MAIL_TEXT: Translations.text(TranslationKey.CONFIRM_MAIL_TEXT),
                    CONFIRM_MAIL_TEXT2: Translations.text(TranslationKey.CONFIRM_MAIL_TEXT2),
                    SINCERELY: Translations.text(TranslationKey.SINCERELY),
                },
                text: Translations.text(TranslationKey.CONFIRM_MAIL_TEXT),
                template: this.mailTemplateService.getConfirmMailTemplate(),
            });
            return response;
        } catch (e) {
            throw new CustomError({
                message: `Cant send mail by provider reason : ${JSON.stringify(e)}`,
                errorCode: ErrorCode.EMAIL_CANT_SEND,
            });
        }
    }

    private isConfirmationCodeAlreadySend(payload: IEmailConfirmationData): boolean {
        const timeManager = new TimeManagerUTC();
        return payload && !timeManager.isFirstDateLessThanSecond(payload.expiresAt, timeManager.getCurrentTime());
    }

    public async createConfirmationMail(userId: number, email: string, trx?: ITransaction): Promise<IEmailConfirmationData> {
        try {
            const confirmationCode: number = this.createConfirmationKey();
            const userConfirmationData = await this.emailConfirmationDataAccess.getUserConfirmationWithCode(
                userId,
                confirmationCode,
            );
            if (
                Utils.isNull(userConfirmationData) &&
                !this.isConfirmationCodeAlreadySend(userConfirmationData as IEmailConfirmationData)
            ) {
                const timeManager = new TimeManagerUTC();
                timeManager.addTime(...CONFIRMATION_MAIL_EXPIRED_TIME);
                const expiresAt = timeManager.getCurrentTime();
                const result = await this.emailConfirmationDataAccess.createUserConfirmation(
                    {
                        userId,
                        email,
                        confirmationCode,
                        expiresAt,
                    },
                    trx,
                );
                return result;
            }
            throw new ValidationError({
                message: 'Sending confirmation mail failed, mail already send',
                errorCode: ErrorCode.EMAIL_VERIFICATION_ALREADY_SEND,
            });
        } catch (e) {
            this._logger.info(`Send confirmation mail to user failed due reason: ${(e as { message: string }).message}`);
            throw e;
        }
    }

    public async sendConfirmationMailToUser(userId: number, email: string): Promise<IEmailConfirmationData> {
        const userConfirmationData = await this.emailConfirmationDataAccess.getUserConfirmationWithEmail(userId, email);
        if (userConfirmationData?.confirmed) {
            throw new ValidationError({
                message: 'Send confirmation failed due mail already confirmed',
                errorCode: ErrorCode.EMAIL_VERIFICATION_ALREADY_DONE,
            });
        }
        const userConfirmationDataInWork = userConfirmationData as IEmailConfirmationData;
        await this.sendMail(userConfirmationDataInWork.email, userConfirmationDataInWork.confirmationCode);
        return userConfirmationDataInWork;
    }

    public async deleteUserConfirmation(userId: number, code: number): Promise<boolean> {
        return await this.emailConfirmationDataAccess.deleteUserConfirmation(userId, code);
    }

    public async getUserConfirmation(userId: number, code: number): Promise<IEmailConfirmationData | undefined> {
        return await this.emailConfirmationDataAccess.getUserConfirmationWithCode(userId, code);
    }
}
