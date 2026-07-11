import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import MailNotificationServiceBuilder from 'src/services/notification/MailNotificationServiceBuilder';
import PasswordChangingDataAccess from 'src/services/passwordChanging/PasswordChangingDataAccess';
import PasswordChangingService from 'src/services/passwordChanging/PasswordChangingService';
import UserServiceBuilder from 'src/services/user/UserServiceBuilder';

export default class PasswordChangingServiceBuilder {
    public static build() {
        const db = DatabaseConnectionBuilder.build();
        return new PasswordChangingService(
            new PasswordChangingDataAccess(db),
            UserServiceBuilder.build(),
            db,
            MailNotificationServiceBuilder.build(),
        );
    }
}
