const UserRegistrationService = require('./UserRegistrationService');
import MailService from '../mail/MailService';
import AccountService from '../account/AccountService';
import UserService from '../user/UserService';
import ProfileService from '../profile/ProfileService';
import CategoryService from '../category/CategoryService';
import GroupService from '../group/GroupService';
import IncomeService from '../income/IncomeService';
import MailTemplateService from '../mailTamplate/MailTemplateService';
import EmailConfirmationService from '../emailConfirmation/EmailConfirmationService';

import UserDataAccess from '../user/UserDataAccess';
import ProfileDataAccess from '../profile/ProfileDataAccess';
import AccountDataAccess from '../account/AccountDataAccess';
import CategoryDataAccess from '../category/CategoryDataAccess';
import GroupDataAccess from '../group/GroupDataAccess';
import IncomeDataAccess from '../income/IncomeDataAccess';
const EmailConfirmationDataAccess = require('../emailConfirmation/EmailConfirmationDataAccess');

import DatabaseConnection from 'src/repositories/DatabaseConnection';
const dbConfig = require('../../config/dbConfig');

export default class UserRegistrationServiceBuilder {
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
            // emailConfirmationService: new EmailConfirmationService(
            //     new EmailConfirmationDataAccess(databaseConnection),
            //     new MailService(),
            //     new MailTemplateService(),
            // ),
            // profileService: new ProfileService(new ProfileDataAccess(databaseConnection)),
        });
    }
}
