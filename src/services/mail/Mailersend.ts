import { IMailEngine } from 'interfaces/IMailEngine';

import { ISendMailPayload } from 'interfaces/ISendMailPayload';
import { ISendMailResponse } from 'interfaces/ISendMailResponse';
import { MailerSend as MailerSendType } from 'mailersend';

const { Recipient } = require('mailersend');
const { Sender } = require('mailersend');
const { EmailParams } = require('mailersend');
const MailerSendSource = require('mailersend').MailerSend;

export default class MailerSend implements IMailEngine {
    private mailerSend: MailerSendType;

    constructor(apiKey: string | undefined) {
        this.mailerSend = new MailerSendSource({
            apiKey,
        });
    }

    async send(payload: ISendMailPayload): Promise<ISendMailResponse> {
        const { tags = [], subject, sender, html, template } = payload;
        const recipients = payload.recipients.map((payload) => new Recipient(payload.mail, payload.name));
        const emailParams = new EmailParams().setFrom(new Sender(sender.mail, sender.name)).setTo(recipients).setSubject(subject);
        if (html) {
            emailParams.setHtml(html);
        }
        if (template) {
            emailParams.setTemplateId(template);
        }
        if (tags) {
            emailParams.setPersonalization(
                payload.recipients.map((payload) => ({
                    email: payload.mail,
                    data: tags,
                })),
            );
        }

        const response = await this.mailerSend.email.send(emailParams);
        return {
            statusCode: response.statusCode,
            payload: response.body,
        };
    }
}
