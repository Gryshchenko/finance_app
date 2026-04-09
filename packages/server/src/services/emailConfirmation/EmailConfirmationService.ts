import { IEmailConfirmationDataAccess } from 'services/emailConfirmation/EmailConfirmationDataAccess';
import { EmailConfirmationStatusType } from 'tenpercent/shared';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { ErrorCode } from 'tenpercent/shared';
import { IMailService } from 'interfaces/IMailService';
import { IMailTemplateService } from 'interfaces/IMailTemplateService';
import { TranslationKey } from 'types/TranslationKey';
import { IEmailConfirmationData } from 'interfaces/IEmailConfirmationData';
import Translations from 'src/services/translations/Translations';
import TimeManagerUTC from 'src/utils/TimeManagerUTC';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { getConfig } from 'src/config/config';
import { CustomError } from 'src/utils/errors/CustomError';
import { ValidationError } from 'src/utils/errors/ValidationError';

import { HttpCode } from 'tenpercent/shared';
import { ConfirmationHelper } from 'services/confirmation/ConfirmationHelper';
import { Utils } from 'tenpercent/shared';
import { UserStatus } from 'tenpercent/shared';
import { IEmailVerifyResponse } from 'tenpercent/shared';
import { IUserService } from 'services/user/UserService';

const CONFIRMATION_MAIL_EXPIRED_TIME: [number, number, number] = [0, 10, 0];

export interface IEmailConfirmationService {
    createEmailConfirmation(userId: number, email: string, trx?: IDBTransaction): Promise<IEmailConfirmationData>;
    sendConfirmationEmail(userId: number, email: string, properties: IEmailConfirmationData): Promise<IEmailConfirmationData>;
    resendConfirmationEmail(userId: number, email: string): Promise<{ expiresAt: string } | undefined>;
    confirmEmail(userId: number, email: string, confirmationCode: number, trx?: IDBTransaction): Promise<IEmailVerifyResponse>;
    getEmailConfirmation(userId: number, email: string): Promise<IEmailConfirmationData | undefined>;
    deleteEmailConfirmation(userId: number, email: string): Promise<boolean>;
}

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
                errorCode: ErrorCode.EMAIL_CANNOT_SEND_ERROR,
            });
        }
    }

    public async createEmailConfirmation(userId: number, email: string, trx?: IDBTransaction): Promise<IEmailConfirmationData> {
        try {
            const confirmationCode: number = ConfirmationHelper.generateCode();
            const userConfirmationData = await this.emailConfirmationDataAccess.getUserConfirmation(userId, email);
            const userConfirmationDataInWork = userConfirmationData as IEmailConfirmationData;
            if (!Utils.isObjectEmpty(userConfirmationDataInWork as unknown as Record<string, unknown>)) {
                await this.validateConfirmation(userConfirmationDataInWork, {
                    requirePending: true,
                });
            }
            const expiresAt = ConfirmationHelper.createExpiresAt(CONFIRMATION_MAIL_EXPIRED_TIME);
            return await this.emailConfirmationDataAccess.createUserConfirmation(
                userId,
                email,
                {
                    confirmationCode,
                    expiresAt,
                    status: EmailConfirmationStatusType.Pending,
                },
                trx,
            );
        } catch (e) {
            this._logger.error(`Create confirmation mail to user failed due reason: ${(e as { message: string }).message}`);
            throw e;
        }
    }

    public async sendConfirmationEmail(
        userId: number,
        email: string,
        userConfirmationDataInWork: IEmailConfirmationData,
    ): Promise<IEmailConfirmationData> {
        await this.validateConfirmation(userConfirmationDataInWork, {
            requirePending: true,
        });
        this.sendMail(userConfirmationDataInWork.email, userConfirmationDataInWork.confirmationCode).catch((e) => {
            this._logger.error('Send mail error', e);
        });
        return userConfirmationDataInWork;
    }

    public async resendConfirmationEmail(userId: number, email: string): Promise<{ expiresAt: string } | undefined> {
        let userConfirmationData = await this.emailConfirmationDataAccess.getUserConfirmation(userId, email);
        if (Utils.isObjectEmpty(userConfirmationData as unknown as Record<string, unknown>)) {
            userConfirmationData = await this.createEmailConfirmation(userId, email);
        }
        const userConfirmationDataInWork = userConfirmationData as IEmailConfirmationData;
        await this.validateConfirmation(userConfirmationDataInWork, { requirePending: true, checkIsExpired: false });

        const newTime = ConfirmationHelper.createExpiresAt(CONFIRMATION_MAIL_EXPIRED_TIME);
        const confirmationCode: number = ConfirmationHelper.generateCode();
        await this.emailConfirmationDataAccess.patchUserConfirmation(
            userId,
            email,
            Number(userConfirmationDataInWork.confirmationId),
            {
                confirmationCode,
                expiresAt: newTime,
            },
        );
        this.sendMail(userConfirmationDataInWork.email, confirmationCode).catch((e) => {
            this._logger.error('Send mail error', e);
        });
        return {
            expiresAt: newTime.toISOString(),
        };
    }

    public async confirmEmail(
        userId: number,
        email: string,
        confirmationCode: number,
        trx?: IDBTransaction,
    ): Promise<IEmailVerifyResponse> {
        const userConfirmationData = await this.emailConfirmationDataAccess.getUserConfirmation(userId, email);
        if (Utils.isObjectEmpty(userConfirmationData as unknown as Record<string, unknown>)) {
            throw new ValidationError({
                message: `No confirmation found for userId ${userId} with email ${email}`,
                errorCode: ErrorCode.EMAIL_CONFIRMATION_ERROR,
                statusCode: HttpCode.NOT_FOUND,
            });
        }
        const userConfirmationDataInWork = userConfirmationData as IEmailConfirmationData;
        await this.validateConfirmation(userConfirmationDataInWork, {
            requirePending: true,
            checkCode: confirmationCode,
            checkIsExpired: true,
        });
        await this.emailConfirmationDataAccess.patchUserConfirmation(
            userId,
            email,
            Number(userConfirmationDataInWork.confirmationId),
            { status: EmailConfirmationStatusType.Confirmed },
            trx,
        );
        await this.userService.patch(userId, { status: UserStatus.ACTIVE });
        return {
            status: EmailConfirmationStatusType.Confirmed,
            confirmationId: userConfirmationData?.confirmationId as number,
        };
    }

    public async deleteEmailConfirmation(userId: number, email: string): Promise<boolean> {
        return await this.emailConfirmationDataAccess.deleteUserConfirmation(userId, email);
    }

    public async getEmailConfirmation(userId: number, email: string): Promise<IEmailConfirmationData | undefined> {
        return await this.emailConfirmationDataAccess.getUserConfirmation(userId, email);
    }

    private createExpiredCodeError(): ValidationError {
        return new ValidationError({
            message: 'Sending confirmation mail failed, code expired',
            errorCode: ErrorCode.EMAIL_VERIFICATION_CODE_EXPIRED_ERROR,
        });
    }
    private createNotExpiredCodeError(): ValidationError {
        return new ValidationError({
            message: 'Sending confirmation mail failed, code not expired',
            errorCode: ErrorCode.EMAIL_VERIFICATION_CODE_STILL_ACTIVE_ERROR,
        });
    }

    private createAlreadyConfirmedError(): ValidationError {
        return new ValidationError({
            message: 'Send confirmation failed due mail already confirmed',
            errorCode: ErrorCode.EMAIL_VERIFICATION_ALREADY_DONE_ERROR,
        });
    }

    private createNotVerifiedError(): ValidationError {
        return new ValidationError({
            message: 'Status not verified',
            errorCode: ErrorCode.EMAIL_CONFIRMATION_ERROR,
        });
    }

    private createInvalidCodeError(): ValidationError {
        return new ValidationError({
            message: 'Confirmation code not same',
            errorCode: ErrorCode.EMAIL_CONFIRMATION_ERROR,
            statusCode: HttpCode.BAD_REQUEST,
            payload: {
                field: 'confirmationCode',
                reason: 'invalid',
            },
        });
    }

    private async validateConfirmation(
        payload: IEmailConfirmationData,
        options: {
            requirePending?: boolean;
            checkCode?: number;
            checkIsExpired?: boolean;
        } = {},
    ): Promise<void> {
        this.assertNotConfirmed(payload);

        if (options.requirePending) {
            this.assertIsPending(payload);
        }

        if (typeof options.checkCode === 'number') {
            this.assertCodeValid(payload, options.checkCode);
        }
        if (options.checkIsExpired) {
            this.assertExpired(payload);
        } else if (options.checkIsExpired === false) {
            this.assertNotExpired(payload);
        }
    }
    private assertNotConfirmed(payload: IEmailConfirmationData): void {
        if (payload?.status === EmailConfirmationStatusType.Confirmed) {
            throw this.createAlreadyConfirmedError();
        }
    }

    private assertIsPending(payload: IEmailConfirmationData): void {
        if (payload?.status !== EmailConfirmationStatusType.Pending) {
            throw this.createNotVerifiedError();
        }
    }

    private assertCodeValid(payload: IEmailConfirmationData, codeFromUser: number): void {
        if (isNaN(codeFromUser) || payload.confirmationCode !== codeFromUser) {
            throw this.createInvalidCodeError();
        }
    }

    private assertNotExpired(payload: IEmailConfirmationData): void {
        const timeManager = new TimeManagerUTC();
        if (timeManager.isFirstDateLessThanSecond(timeManager.getCurrentTime(), payload?.expiresAt)) {
            throw this.createNotExpiredCodeError();
        }
    }

    private assertExpired(payload: IEmailConfirmationData): void {
        const timeManager = new TimeManagerUTC();
        if (timeManager.isFirstDateLessThanSecond(payload?.expiresAt, timeManager.getCurrentTime())) {
            throw this.createExpiredCodeError();
        }
    }
}
