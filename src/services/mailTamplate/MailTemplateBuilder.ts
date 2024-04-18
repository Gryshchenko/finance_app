import { IMailTemplateEngine } from 'interfaces/IMailTemplateEngine';

import MailTemplateEngine from './MailersendTemplate';

export default class MailEngineBuilder {
    public static build(): IMailTemplateEngine {
        return new MailTemplateEngine();
    }
}
