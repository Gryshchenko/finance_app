import { IEmailConfirmationDataAccess } from 'interfaces/IEmailConfirmationDataAccess';
import { IEmailConfirmationService } from 'interfaces/IEmailConfirmationService';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { ErrorCode } from 'types/ErrorCode';
import { IMailService } from 'interfaces/IMailService';
import { IMailTemplateService } from 'interfaces/IMailTemplateService';

const TimeManagerUTC = require('../../utils/TimeManagerUTC');
const Success = require('../../utils/success/Success');
const Failure = require('../../utils/failure/Failure');
const { randomBytes } = require('crypto');

module.exports = class EmailConfirmationService extends LoggerBase implements IEmailConfirmationService {
    protected emailConfirmationDataAccess: IEmailConfirmationDataAccess;
    protected mailService: IMailService;
    protected mailTemplateService: IMailTemplateService;
    public constructor(
        emailConfirmationDataAccess: IEmailConfirmationDataAccess,
        emailService: IMailService,
        mailTemplateService: IMailTemplateService,
    ) {
        super();
        this.emailConfirmationDataAccess = emailConfirmationDataAccess;
        this.mailService = emailService;
        this.mailTemplateService = mailTemplateService;
    }

    private createConfirmationKey(): number {
        const buffer = randomBytes(4);
        let number = buffer.readUInt32BE(0);
        return Number(number.toString().padStart(8, '0').substring(0, 8));
    }
    private async sendConfirmationMailToUser(email: string, confirmationCode: number): Promise<ISuccess<unknown> | IFailure> {
        const response = await this.mailService.sendMail({
            subject: 'Test mail',
            sender: { mail: 'MS_c5djdt@trial-jy7zpl991r3l5vx6.mlsender.net', name: 'fin_app' },
            recipients: [{ mail: email, name: 'Dear Guest' }],
            tags: {
                code: confirmationCode,
                company: 'Data',
            },
            text: 'Test mail',
            template: this.mailTemplateService.getConfirmMailTemplate(),
        });
        return new Success();
    }

    private isConfirmationCodeAlreadySend(payload: IEmailConfirmationData): boolean {
        const timeManager = new TimeManagerUTC();
        return payload && !timeManager.isFirstDateLessThanSecond(payload.expiresAt, timeManager.getCurrentTime());
    }

    private async storeConfirmationMailData(
        userId: number,
        email: string,
        confirmationCode: number,
    ): Promise<ISuccess<IEmailConfirmationData> | IFailure> {
        const userConfirmationData = await this.emailConfirmationDataAccess.getUserConfirmation(userId, email);
        try {
            if (!this.isConfirmationCodeAlreadySend(userConfirmationData)) {
                const timeManager = new TimeManagerUTC();
                timeManager.addTime(1);
                const expiresAt = timeManager.getCurrentTime();
                const result = await this.emailConfirmationDataAccess.createUserConfirmation({
                    userId,
                    email,
                    confirmationCode,
                    expiresAt,
                });
                return new Success(result);
            } else {
                return new Failure('Already send', ErrorCode.EMAIL_VERIFICATION_ALREADY_SEND, true);
            }
        } catch (error) {
            return new Failure(error, ErrorCode.EMAIL_CANT_SEND, false);
        }
    }

    public async sendConfirmationMail(userId: number, email: string): Promise<ISuccess<IEmailConfirmationData> | IFailure> {
        const confirmationCode = this.createConfirmationKey();
        this._logger.info('confirmationCode created');
        const confirmation = await this.storeConfirmationMailData(userId, email, confirmationCode);
        if (confirmation instanceof Success) {
            this._logger.info('confirmation data stored');
            const mailSendResponse = await this.sendConfirmationMailToUser(email, confirmationCode);
            if (mailSendResponse instanceof Success) {
                this._logger.info('confirmation mail send');
                return new Success();
            } else {
                this._logger.info('confirmation mail send failed');
                return new Failure('Cant send mail');
            }
        } else {
            this._logger.info('confirmation data failed to stored: ' + (confirmation as IFailure).error);
            return new Failure('Cant store data');
        }
    }

    public async sendAgainConfirmationMail(
        userId: number,
        email: string,
        confirmationCode: number = this.createConfirmationKey(),
    ): Promise<ISuccess<IEmailConfirmationData> | IFailure> {
        const userConfirmationData = await this.emailConfirmationDataAccess.getUserConfirmation(userId, email);
        try {
            if (!this.isConfirmationCodeAlreadySend(userConfirmationData)) {
                const timeManager = new TimeManagerUTC();
                timeManager.addTime(1);
                const expiresAt = timeManager.getCurrentTime();
                const result = await this.emailConfirmationDataAccess.updateUserConfirmation({
                    userId,
                    email,
                    confirmationCode,
                    expiresAt,
                });
                return new Success(result);
            } else {
                return new Failure('Already send', ErrorCode.EMAIL_VERIFICATION_ALREADY_SEND, true);
            }
        } catch (error) {
            return new Failure(error, ErrorCode.EMAIL_CANT_SEND, false);
        }
    }
};
