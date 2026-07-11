import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';

import { ISendMailPayload } from 'interfaces/ISendMailPayload';
import { ISendMailResponse } from 'interfaces/ISendMailResponse';
import { IMailProvider } from 'services/mail/MailProviderBuilder';

export interface IAwsSesProviderConfig {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
}

export default class AwsSesProvider implements IMailProvider {
    private readonly client: SESv2Client;

    public constructor(config: IAwsSesProviderConfig) {
        this.client = new SESv2Client({
            region: config.region,
            ...(config.accessKeyId && config.secretAccessKey
                ? { credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } }
                : {}),
        });
    }

    public async send(payload: ISendMailPayload): Promise<ISendMailResponse> {
        const { sender, recipients, subject, text, html } = payload;

        const command = new SendEmailCommand({
            FromEmailAddress: sender.name ? `${sender.name} <${sender.mail}>` : sender.mail,
            Destination: {
                ToAddresses: recipients.map((recipient) => recipient.mail),
            },
            Content: {
                Simple: {
                    Subject: { Data: subject, Charset: 'UTF-8' },
                    Body: {
                        Text: { Data: text, Charset: 'UTF-8' },
                        ...(html ? { Html: { Data: html, Charset: 'UTF-8' } } : {}),
                    },
                },
            },
        });

        const response = await this.client.send(command);
        return {
            statusCode: response.$metadata.httpStatusCode ?? 0,
            payload: { messageId: response.MessageId },
        };
    }
}
