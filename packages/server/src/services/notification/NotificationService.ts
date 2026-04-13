import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IMailService } from 'interfaces/IMailService';
import { getConfig } from 'src/config/config';
import { INotificationService, NotificationPayload } from './INotificationService';
import { NotificationType } from './NotificationType';

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
                    template: payload.template,
                    text: payload.text,
                    tags: payload.tags,
                });
                this._logger.info(`Email notification sent to: ${payload.to.email}`);
                break;

            default: {
                const exhaustive: never = payload;
                this._logger.warn(`Unknown notification type: ${(exhaustive as NotificationPayload).type}`);
            }
        }
    }
}
