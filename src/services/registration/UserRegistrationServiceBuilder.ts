const UserRegistrationService = require('./UserRegistrationService');
const MailService = require('../mail/MailService');
const AccountService = require('../account/AccountService');
const UserService = require('../user/UserService');
const CategoryService = require('../category/CategoryService');
const GroupService = require('../group/GroupService');
const IncomeService = require('../income/IncomeService');
const MailTemplateService = require('../mailTamplate/MailTemplateService');
const EmailConfirmationService = require('../emailConfirmation/EmailConfirmationService');

const UserDataAccess = require('../user/UserDataAccess');
const AccountDataAccess = require('../account/AccountDataAccess');
const CategoryDataAccess = require('../category/CategoryDataAccess');
const GroupDataAccess = require('../group/GroupDataAccess');
const IncomeDataAccess = require('../income/IncomeDataAccess');
const EmailConfirmationDataAccess = require('../emailConfirmation/EmailConfirmationDataAccess');

const DatabaseConnection = require('../../repositories/DatabaseConnection');
const dbConfig = require('../../config/dbConfig');

module.exports = class UserRegistrationServiceBuilder {
    public static build() {
        return new UserRegistrationService(
            new UserService(new UserDataAccess(new DatabaseConnection(dbConfig))),
            new AccountService(new AccountDataAccess(new DatabaseConnection(dbConfig))),
            new CategoryService(new CategoryDataAccess(new DatabaseConnection(dbConfig))),
            new GroupService(new GroupDataAccess(new DatabaseConnection(dbConfig))),
            new IncomeService(new IncomeDataAccess(new DatabaseConnection(dbConfig))),
            new MailService(),
            new MailTemplateService(),
            new EmailConfirmationService(
                new EmailConfirmationDataAccess(new DatabaseConnection(dbConfig)),
                new MailService(),
                new MailTemplateService(),
            ),
        );
    }
};
