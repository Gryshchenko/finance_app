import { IMailTemplateEngine } from 'interfaces/IMailTemplateEngine';

const MailerSendTemplate = require('./MailersendTemplate');

module.exports = class MailEngineBuilder {
    public static build(): IMailTemplateEngine {
        return new MailerSendTemplate();
    }
};
