namespace EmailConfirmationServiceBuilder {
    const MailService = require('../mail/MailService');
    const MailTemplateService = require('../mailTamplate/MailTemplateService');
    const EmailConfirmationService = require('../emailConfirmation/EmailConfirmationService');

    const EmailConfirmationDataAccess = require('../emailConfirmation/EmailConfirmationDataAccess');

    const DatabaseConnection = require('../../repositories/DatabaseConnection');
    const dbConfig = require('../../config/dbConfig');

    module.exports = class UserRegistrationServiceBuilder {
        public static build() {
            const databaseConnection = new DatabaseConnection(dbConfig);
            return new EmailConfirmationService(
                new EmailConfirmationDataAccess(databaseConnection),
                new MailService(),
                new MailTemplateService(),
            );
        }
    };
}
