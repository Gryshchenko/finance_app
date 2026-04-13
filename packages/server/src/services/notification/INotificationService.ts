import { NotificationType } from './NotificationType';

export interface IEmailNotificationPayload {
    type: NotificationType.EMAIL;
    to: { email: string; name: string };
    subject: string;
    template: string;
    text: string;
    tags: Record<string, unknown>;
}

// Union type — розширюється при додаванні нових каналів (SMS, Push тощо)
export type NotificationPayload = IEmailNotificationPayload;

export interface INotificationService {
    send(payload: NotificationPayload): Promise<void>;
}
