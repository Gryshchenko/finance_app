const UserRegistrationService = require('./UserRegistrationService');
const MailService = require('../mail/MailService');
const AccountService = require('../account/AccountService');
const UserService = require('../user/UserService');
const ProfileService = require('../profile/ProfileService');
const CategoryService = require('../category/CategoryService');
const GroupService = require('../group/GroupService');
const IncomeService = require('../income/IncomeService');
const MailTemplateService = require('../mailTamplate/MailTemplateService');
const EmailConfirmationService = require('../emailConfirmation/EmailConfirmationService');

const UserDataAccess = require('../user/UserDataAccess');
const ProfileDataAccess = require('../profile/ProfileDataAccess');
const AccountDataAccess = require('../account/AccountDataAccess');
const CategoryDataAccess = require('../category/CategoryDataAccess');
const GroupDataAccess = require('../group/GroupDataAccess');
const IncomeDataAccess = require('../income/IncomeDataAccess');
const EmailConfirmationDataAccess = require('../emailConfirmation/EmailConfirmationDataAccess');

const DatabaseConnection = require('../../repositories/DatabaseConnection');
const dbConfig = require('../../config/dbConfig');

module.exports = class UserRegistrationServiceBuilder {
    public static build() {
        const databaseConnection = new DatabaseConnection(dbConfig);
        return new UserRegistrationService({
            userService: new UserService(new UserDataAccess(databaseConnection)),
            accountService: new AccountService(new AccountDataAccess(databaseConnection)),
            categoryService: new CategoryService(new CategoryDataAccess(databaseConnection)),
            groupService: new GroupService(new GroupDataAccess(databaseConnection)),
            incomeService: new IncomeService(new IncomeDataAccess(databaseConnection)),
            mailService: new MailService(),
            mailTemplateService: new MailTemplateService(),
            emailConfirmationService: new EmailConfirmationService(
                new EmailConfirmationDataAccess(databaseConnection),
                new MailService(),
                new MailTemplateService(),
            ),
            profileService: new ProfileService(new ProfileDataAccess(databaseConnection)),
        });
    }
};
