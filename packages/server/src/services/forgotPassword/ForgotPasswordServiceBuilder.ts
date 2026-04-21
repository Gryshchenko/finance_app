import ForgotPasswordDataAccess from 'services/forgotPassword/ForgotPasswordDataAccess';
import ForgotPasswordService from 'services/forgotPassword/ForgotPasswordService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';
import UserServiceBuilder from 'src/services/user/UserServiceBuilder';

export default class ForgotPasswordServiceBuilder {
    public static build() {
        return new ForgotPasswordService(
            new ForgotPasswordDataAccess(DatabaseConnectionBuilder.build()),
            UserServiceBuilder.build(),
        );
    }
}
