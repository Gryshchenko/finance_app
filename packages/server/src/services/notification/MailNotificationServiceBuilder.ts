import MailTemplateService from 'services/mailTamplate/MailTemplateService';

import MailNotificationService from './MailNotificationService';
import NotificationServiceBuilder from './NotificationServiceBuilder';

export default class MailNotificationServiceBuilder {
    public static build(): MailNotificationService {
        return new MailNotificationService(NotificationServiceBuilder.build(), new MailTemplateService());
    }
}
