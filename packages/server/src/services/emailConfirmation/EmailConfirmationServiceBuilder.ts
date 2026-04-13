import EmailConfirmationService from 'src/services/emailConfirmation/EmailConfirmationService';
import EmailConfirmationDataAccess from 'src/services/emailConfirmation/EmailConfirmationDataAccess';
import UserServiceBuilder from 'src/services/user/UserServiceBuilder';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import NotificationServiceBuilder from 'services/notification/NotificationServiceBuilder';
import ConfirmationEmailNotification from 'services/notification/emails/ConfirmationEmailNotification';
import MailTemplateService from 'services/mailTamplate/MailTemplateService';

export default class EmailConfirmationServiceBuilder {
    public static build() {
        const confirmationEmailNotification = new ConfirmationEmailNotification(
            NotificationServiceBuilder.build(),
            new MailTemplateService(),
        );
        return new EmailConfirmationService(
            new EmailConfirmationDataAccess(DatabaseConnectionBuilder.build()),
            confirmationEmailNotification,
            UserServiceBuilder.build(),
        );
    }
}
