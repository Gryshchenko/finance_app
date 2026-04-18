import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import EmailConfirmationDataAccess from 'src/services/emailConfirmation/EmailConfirmationDataAccess';
import EmailConfirmationService from 'src/services/emailConfirmation/EmailConfirmationService';
import UserServiceBuilder from 'src/services/user/UserServiceBuilder';

export default class EmailConfirmationServiceBuilder {
    public static build() {
        return new EmailConfirmationService(
            new EmailConfirmationDataAccess(DatabaseConnectionBuilder.build()),
            UserServiceBuilder.build(),
        );
    }
}
