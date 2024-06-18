import AccountDataAccess from 'services/account/AccountDataAccess';
import AccountService from 'services/account/AccountService';
import DatabaseConnectionBuilder from 'src/repositories/DatabaseConnectionBuilder';

export default class AccountServiceBuilder {
    public static build() {
        return new AccountService(new AccountDataAccess(DatabaseConnectionBuilder.build()));
    }
}
