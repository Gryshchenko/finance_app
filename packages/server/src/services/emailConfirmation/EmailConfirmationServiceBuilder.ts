import MailTemplateService from 'services/mailTamplate/MailTemplateService';
import ConfirmationEmailNotification from 'services/notification/emails/ConfirmationEmailNotification';
import NotificationServiceBuilder from 'services/notification/NotificationServiceBuilder';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import EmailConfirmationDataAccess from 'src/services/emailConfirmation/EmailConfirmationDataAccess';
import EmailConfirmationService from 'src/services/emailConfirmation/EmailConfirmationService';
import UserServiceBuilder from 'src/services/user/UserServiceBuilder';

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
