import { IMailService } from 'services/mail/MailService';
import { getConfig } from 'src/config/config';
import { LoggerBase } from 'src/helper/logger/LoggerBase';

import { NotificationType } from './NotificationType';

export interface IEmailNotificationPayload {
    type: NotificationType.EMAIL;
    to: { email: string; name: string };
    subject: string;
    text: string;
    html?: string;
}

export type NotificationPayload = IEmailNotificationPayload;

export interface INotificationService {
    send(payload: NotificationPayload): Promise<void>;
}

export default class NotificationService extends LoggerBase implements INotificationService {
    private readonly _mailService: IMailService;

    public constructor(mailService: IMailService) {
        super();
        this._mailService = mailService;
    }

    public async send(payload: NotificationPayload): Promise<void> {
        switch (payload.type) {
            case NotificationType.EMAIL:
                await this._mailService.sendMail({
                    sender: {
                        mail: String(getConfig().mailNotReply),
                        name: String(getConfig().appName),
                    },
                    recipients: [{ mail: payload.to.email, name: payload.to.name }],
                    subject: payload.subject,
                    text: payload.text,
                    html: payload.html,
                });
                this._logger.info(`Email notification sent to: ${payload.to.email}`);
                break;

            default: {
                this._logger.warn(`Unknown notification type: ${(payload as NotificationPayload).type}`);
            }
        }
    }
}
