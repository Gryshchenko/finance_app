import config from 'src/config/dbConfig';

import DatabaseConnection from 'src/repositories/DatabaseConnection';
import UserRoleService from 'src/services/userRole/UserRoleService';
import UserRoleDataService from 'src/services/userRole/UserRoleDataAccess';
import UserRegistrationService from 'src/services/registration/UserRegistrationService';
import CurrencyService from 'src/services/currency/CurrencyService';
import CurrencyDataService from 'src/services/currency/CurrencyDataAccess';
import EmailConfirmationDataAccess from 'src/services/emailConfirmation/EmailConfirmationDataAccess';
import MailService from '../mail/MailService';
import AccountService from '../account/AccountService';
import ProfileService from '../profile/ProfileService';
import CategoryService from '../category/CategoryService';
import GroupService from '../group/GroupService';
import IncomeService from '../income/IncomeService';
import MailTemplateService from '../mailTamplate/MailTemplateService';
import EmailConfirmationService from '../emailConfirmation/EmailConfirmationService';

import ProfileDataAccess from '../profile/ProfileDataAccess';
import AccountDataAccess from '../account/AccountDataAccess';
import CategoryDataAccess from '../category/CategoryDataAccess';
import GroupDataAccess from '../group/GroupDataAccess';
import IncomeDataAccess from '../income/IncomeDataAccess';
import UserServiceBuilder from 'src/services/user/UserServiceBuilder';

export default class UserRegistrationServiceBuilder {
    public static build() {
        const databaseConnection = new DatabaseConnection(config);
        return new UserRegistrationService({
            userService: UserServiceBuilder.build(),
            accountService: new AccountService(new AccountDataAccess(databaseConnection)),
            categoryService: new CategoryService(new CategoryDataAccess(databaseConnection)),
            groupService: new GroupService(new GroupDataAccess(databaseConnection)),
            incomeService: new IncomeService(new IncomeDataAccess(databaseConnection)),
            mailService: new MailService(),
            mailTemplateService: new MailTemplateService(),
            userRoleService: new UserRoleService(new UserRoleDataService(databaseConnection)),
            profileService: new ProfileService(new ProfileDataAccess(databaseConnection)),
            currencyService: new CurrencyService(new CurrencyDataService(databaseConnection)),
            emailConfirmationService: new EmailConfirmationService(
                new EmailConfirmationDataAccess(databaseConnection),
                new MailService(),
                new MailTemplateService(),
                UserServiceBuilder.build(),
            ),
            db: databaseConnection,
        });
    }
}
