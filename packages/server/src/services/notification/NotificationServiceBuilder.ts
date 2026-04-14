import MailService from 'services/mail/MailService';

import NotificationService from './NotificationService';

export default class NotificationServiceBuilder {
    public static build(): NotificationService {
        return new NotificationService(new MailService());
    }
}
