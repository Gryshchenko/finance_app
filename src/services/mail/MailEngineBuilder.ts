import { IMailEngine } from 'interfaces/IMailEngine';
import * as process from 'process';
require('dotenv').config();

const MailerSend = require('./Mailersend');

module.exports = class MailEngineBuilder {
    public static build(): IMailEngine {
        return new MailerSend(process.env.MAIL_API_KEY);
    }
};
