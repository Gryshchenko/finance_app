import { IMailTemplateEngine } from 'interfaces/IMailTemplateEngine';

module.exports = class MailTemplateEngine implements IMailTemplateEngine {
    constructor() {}

    getConfirmMailTemplate(): string {
        return 'k68zxl22wpelj905';
    }
    getForgetPasswordTemplate(): string {
        return 'z3m5jgrnpeoldpyo';
    }
};
