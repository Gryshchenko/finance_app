import { IMailEngine } from 'interfaces/IMailEngine';
import * as process from 'process';

import MailerSend from './Mailersend';

export default class MailEngineBuilder {
    public static build(): IMailEngine {
        return new MailerSend(process.env.MAIL_API_KEY);
    }
}
