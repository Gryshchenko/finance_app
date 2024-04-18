import { IMailTemplateEngine } from 'interfaces/IMailTemplateEngine';

export default class MailTemplateEngine implements IMailTemplateEngine {
    constructor() {}

    getConfirmMailTemplate(): string {
        return 'k68zxl22wpelj905';
    }
    getForgetPasswordTemplate(): string {
        return 'z3m5jgrnpeoldpyo';
    }
}
