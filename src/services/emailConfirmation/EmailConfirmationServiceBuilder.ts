import DatabaseConnection from 'src/repositories/DatabaseConnection';
import EmailConfirmationService from 'src/services/emailConfirmation/EmailConfirmationService';
import config from 'src/config/dbConfig';
import MailService from 'src/services/mail/MailService';
import MailTemplateService from 'src/services/mailTamplate/MailTemplateService';
import EmailConfirmationDataAccess from 'src/services/emailConfirmation/EmailConfirmationDataAccess';
import UserService from 'src/services/user/UserService';
import UserDataService from 'src/services/user/UserDataAccess';

export default class UserRegistrationServiceBuilder {
    public static build() {
        const databaseConnection = new DatabaseConnection(config);
        return new EmailConfirmationService(
            new EmailConfirmationDataAccess(databaseConnection),
            new MailService(),
            new MailTemplateService(),
            new UserService(new UserDataService(databaseConnection)),
        );
    }
}
