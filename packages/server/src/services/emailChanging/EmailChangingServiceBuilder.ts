import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import EmailChangingDataAccess from 'src/services/emailChanging/EmailChangingDataAccess';
import EmailChangingService from 'src/services/emailChanging/EmailChangingService';
import MailNotificationServiceBuilder from 'src/services/notification/MailNotificationServiceBuilder';
import UserServiceBuilder from 'src/services/user/UserServiceBuilder';

export default class EmailChangingServiceBuilder {
    public static build() {
        return new EmailChangingService(
            new EmailChangingDataAccess(DatabaseConnectionBuilder.build()),
            UserServiceBuilder.build(),
            MailNotificationServiceBuilder.build(),
        );
    }
}
