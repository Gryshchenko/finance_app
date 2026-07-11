import { IMailTemplateService, IRenderedMail, ResendCodeContext } from 'services/mailTamplate/MailTemplateService';
import { INotificationService } from 'services/notification/NotificationService';
import { NotificationType } from 'services/notification/NotificationType';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import Translations from 'src/services/translations/Translations';
import { TranslationKey } from 'src/types/TranslationKey';

export interface IMailNotificationService {
    sendRegistrationConfirmation(email: string, code: number, expiresInMinutes: number): Promise<void>;
    sendRegistrationCodeResend(email: string, code: number, expiresInMinutes: number): Promise<void>;
    sendEmailChangeConfirmation(email: string, code: number, expiresInMinutes: number): Promise<void>;
    sendEmailChangeCodeResend(email: string, code: number, expiresInMinutes: number): Promise<void>;
    sendPasswordChangeConfirmation(email: string, code: number, expiresInMinutes: number): Promise<void>;
    sendPasswordChangeCodeResend(email: string, code: number, expiresInMinutes: number): Promise<void>;
    sendForgotPasswordCode(email: string, code: number, expiresInMinutes: number): Promise<void>;
}

export default class MailNotificationService extends LoggerBase implements IMailNotificationService {
    private readonly _notificationService: INotificationService;
    private readonly _mailTemplateService: IMailTemplateService;

    public constructor(notificationService: INotificationService, mailTemplateService: IMailTemplateService) {
        super();
        this._notificationService = notificationService;
        this._mailTemplateService = mailTemplateService;
    }

    public sendRegistrationConfirmation(email: string, code: number, expiresInMinutes: number): Promise<void> {
        return this.dispatch(email, this._mailTemplateService.registrationConfirmation(code, expiresInMinutes));
    }

    public sendRegistrationCodeResend(email: string, code: number, expiresInMinutes: number): Promise<void> {
        return this.dispatch(email, this._mailTemplateService.resendCode(ResendCodeContext.REGISTRATION, code, expiresInMinutes));
    }

    public sendEmailChangeConfirmation(email: string, code: number, expiresInMinutes: number): Promise<void> {
        return this.dispatch(email, this._mailTemplateService.emailChangeConfirmation(code, expiresInMinutes));
    }

    public sendEmailChangeCodeResend(email: string, code: number, expiresInMinutes: number): Promise<void> {
        return this.dispatch(email, this._mailTemplateService.resendCode(ResendCodeContext.EMAIL_CHANGE, code, expiresInMinutes));
    }

    public sendPasswordChangeConfirmation(email: string, code: number, expiresInMinutes: number): Promise<void> {
        return this.dispatch(email, this._mailTemplateService.passwordChangeConfirmation(code, expiresInMinutes));
    }

    public sendPasswordChangeCodeResend(email: string, code: number, expiresInMinutes: number): Promise<void> {
        return this.dispatch(
            email,
            this._mailTemplateService.resendCode(ResendCodeContext.PASSWORD_CHANGE, code, expiresInMinutes),
        );
    }

    public sendForgotPasswordCode(email: string, code: number, expiresInMinutes: number): Promise<void> {
        return this.dispatch(email, this._mailTemplateService.forgotPasswordCode(code, expiresInMinutes));
    }

    private async dispatch(email: string, mail: IRenderedMail): Promise<void> {
        try {
            await this._notificationService.send({
                type: NotificationType.EMAIL,
                to: { email, name: Translations.text(TranslationKey.HELLO_GUEST) },
                subject: mail.subject,
                text: mail.text,
                html: mail.html,
            });
        } catch (e) {
            this._logger.error(`Failed to send email to ${email}: ${(e as { message: string }).message}`);
        }
    }
}
