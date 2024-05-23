import { IEmailConfirmationDataAccess } from 'interfaces/IEmailConfirmationDataAccess';
import { IEmailConfirmationService } from 'interfaces/IEmailConfirmationService';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { ErrorCode } from 'types/ErrorCode';
import { IMailService } from 'interfaces/IMailService';
import { IMailTemplateService } from 'interfaces/IMailTemplateService';
import { TranslationKey } from 'types/TranslationKey';
import { IUserService } from 'interfaces/IUserService';
import { IFailure } from 'interfaces/IFailure';
import { ISuccess } from 'interfaces/ISuccess';
import { IEmailConfirmationData } from 'interfaces/IEmailConfirmationData';
import Translations from 'src/services/translations/Translations';
import Success from 'src/utils/success/Success';
import TimeManagerUTC from 'src/utils/TimeManagerUTC';
import Failure from 'src/utils/failure/Failure';
import Utils from 'src/utils/Utils';
import { ITransaction } from 'interfaces/IDatabaseConnection';

require('dotenv').config();

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

    private async sendMail(email: string, confirmationCode: number): Promise<ISuccess<unknown> | IFailure> {
        try {
            const response = await this.mailService.sendMail({
                subject: Translations.text(TranslationKey.CONFIRM_MAIL_ADDRESS),
                sender: { mail: String(process.env.MAIL_NO_REPLY), name: String(process.env.APP_NAME) },
                recipients: [{ mail: email, name: Translations.text(TranslationKey.HELLO_GUEST) }],
                tags: {
                    code: confirmationCode,
                    company: String(process.env.APP_NAME),
                    CONFIRM_MAIL_ADDRESS: Translations.text(TranslationKey.CONFIRM_MAIL_ADDRESS),
                    HELLO_GUEST: Translations.text(TranslationKey.HELLO_GUEST),
                    CONFIRM_MAIL_TEXT: Translations.text(TranslationKey.CONFIRM_MAIL_TEXT),
                    CONFIRM_MAIL_TEXT2: Translations.text(TranslationKey.CONFIRM_MAIL_TEXT2),
                    SINCERELY: Translations.text(TranslationKey.SINCERELY),
                },
                text: Translations.text(TranslationKey.CONFIRM_MAIL_TEXT),
                template: this.mailTemplateService.getConfirmMailTemplate(),
            });
            return new Success(response);
        } catch (e) {
            return new Failure('Cant send mail by provider reason', ErrorCode.EMAIL_CANT_SEND);
        }
    }

    private isConfirmationCodeAlreadySend(payload: IEmailConfirmationData): boolean {
        const timeManager = new TimeManagerUTC();
        return payload && !timeManager.isFirstDateLessThanSecond(payload.expiresAt, timeManager.getCurrentTime());
    }

    public async createConfirmationMail(
        userId: number,
        email: string,
        trx?: ITransaction,
    ): Promise<ISuccess<IEmailConfirmationData> | IFailure> {
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
                return new Success(result);
            }
            return new Failure('Already send', ErrorCode.EMAIL_VERIFICATION_ALREADY_SEND, true);
        } catch (error) {
            return new Failure(String(error), ErrorCode.EMAIL_CANT_SEND, false);
        }
    }

    public async sendConfirmationMailToUser(userId: number, email: string): Promise<ISuccess<IEmailConfirmationData> | IFailure> {
        const userConfirmationData = await this.emailConfirmationDataAccess.getUserConfirmationWithEmail(userId, email);
        if (userConfirmationData && userConfirmationData.confirmed) {
            return new Failure('Already confirmed', ErrorCode.EMAIL_VERIFICATION_ALREADY_DONE, true);
        }
        this._logger.info('confirmation data stored');
        const mailSendResponse = await this.sendMail(userConfirmationData!.email, userConfirmationData!.confirmationCode);
        if (mailSendResponse instanceof Success) {
            this._logger.info('confirmation mail send');
            return new Success(mailSendResponse.value);
        }
        this._logger.error('confirmation mail send failed');
        return new Failure('Cant send mail');
    }

    public async deleteUserConfirmation(userId: number, code: number): Promise<boolean> {
        return await this.emailConfirmationDataAccess.deleteUserConfirmation(userId, code);
    }

    public async getUserConfirmation(userId: number, code: number): Promise<IEmailConfirmationData | undefined> {
        return await this.emailConfirmationDataAccess.getUserConfirmationWithCode(userId, code);
    }
}
