import ForgotPasswordDataAccess from 'services/forgotPassword/ForgotPasswordDataAccess';
import ForgotPasswordService from 'services/forgotPassword/ForgotPasswordService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import MailNotificationServiceBuilder from 'src/services/notification/MailNotificationServiceBuilder';
import UserServiceBuilder from 'src/services/user/UserServiceBuilder';

export default class ForgotPasswordServiceBuilder {
    public static build() {
        const db = DatabaseConnectionBuilder.build();
        return new ForgotPasswordService(
            new ForgotPasswordDataAccess(db),
            UserServiceBuilder.build(),
            db,
            MailNotificationServiceBuilder.build(),
        );
    }
}
