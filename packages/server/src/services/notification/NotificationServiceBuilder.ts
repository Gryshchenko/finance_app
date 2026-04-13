import NotificationService from './NotificationService';
import MailService from 'services/mail/MailService';

export default class NotificationServiceBuilder {
    public static build(): NotificationService {
        return new NotificationService(new MailService());
    }
}
