import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IMailTemplateService } from 'interfaces/IMailTemplateService';
import { IMailTemplateEngine } from 'interfaces/IMailTemplateEngine';

import MailEngineBuilder from './MailTemplateBuilder';

export default class MailTemplateService extends LoggerBase implements IMailTemplateService {
    private engine: IMailTemplateEngine;

    public constructor() {
        super();
        this.engine = MailEngineBuilder.build();
    }

    public getConfirmMailTemplate(): string {
        return this.engine.getConfirmMailTemplate();
    }

    getForgetPasswordTemplate(): string {
        return this.engine.getForgetPasswordTemplate();
    }
}
