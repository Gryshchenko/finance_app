import { IMailTemplateService } from 'interfaces/IMailTemplateService';
import { INotificationService } from 'services/notification/INotificationService';
import { NotificationType } from 'services/notification/NotificationType';
import Translations from 'src/services/translations/Translations';
import { TranslationKey } from 'types/TranslationKey';

export interface IConfirmationEmailNotification {
    send(email: string, confirmationCode: number): Promise<void>;
}

/**
 * App-level facade - знає шаблон, переклади та структуру листа підтвердження.
 * EmailConfirmationService не знає деталей: він просто викликає .send(email, code).
 */
export default class ConfirmationEmailNotification implements IConfirmationEmailNotification {
    private readonly _notificationService: INotificationService;
    private readonly _mailTemplateService: IMailTemplateService;

    public constructor(notificationService: INotificationService, mailTemplateService: IMailTemplateService) {
        this._notificationService = notificationService;
        this._mailTemplateService = mailTemplateService;
    }

    public async send(email: string, confirmationCode: number): Promise<void> {
        await this._notificationService.send({
            type: NotificationType.EMAIL,
            to: {
                email,
                name: Translations.text(TranslationKey.HELLO_GUEST),
            },
            subject: Translations.text(TranslationKey.CONFIRM_MAIL_ADDRESS),
            template: this._mailTemplateService.getConfirmMailTemplate(),
            text: Translations.text(TranslationKey.CONFIRM_MAIL_TEXT),
            tags: {
                code: confirmationCode,
                CONFIRM_MAIL_ADDRESS: Translations.text(TranslationKey.CONFIRM_MAIL_ADDRESS),
                HELLO_GUEST: Translations.text(TranslationKey.HELLO_GUEST),
                CONFIRM_MAIL_TEXT: Translations.text(TranslationKey.CONFIRM_MAIL_TEXT),
                CONFIRM_MAIL_TEXT2: Translations.text(TranslationKey.CONFIRM_MAIL_TEXT2),
                SINCERELY: Translations.text(TranslationKey.SINCERELY),
            },
        });
    }
}
