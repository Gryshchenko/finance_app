import EmailConfirmationService from 'src/services/emailConfirmation/EmailConfirmationService';
import MailService from 'src/services/mail/MailService';
import MailTemplateService from 'src/services/mailTamplate/MailTemplateService';
import EmailConfirmationDataAccess from 'src/services/emailConfirmation/EmailConfirmationDataAccess';
import UserServiceBuilder from 'src/services/user/UserServiceBuilder';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class EmailConfirmationServiceBuilder {
    public static build() {
        return new EmailConfirmationService(
            new EmailConfirmationDataAccess(DatabaseConnectionBuilder.build()),
            new MailService(),
            new MailTemplateService(),
            UserServiceBuilder.build(),
        );
    }
}
