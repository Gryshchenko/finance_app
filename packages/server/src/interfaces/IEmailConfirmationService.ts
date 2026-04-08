import { IEmailConfirmationData } from './IEmailConfirmationData';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';
import { IEmailVerifyResponse } from 'tenpercent/shared';

export interface IEmailConfirmationService {
    createEmailConfirmation(userId: number, email: string, trx?: IDBTransaction): Promise<IEmailConfirmationData>;
    sendConfirmationEmail(userId: number, email: string, properties: IEmailConfirmationData): Promise<IEmailConfirmationData>;
    resendConfirmationEmail(userId: number, email: string): Promise<{ expiresAt: string } | undefined>;
    confirmEmail(userId: number, email: string, confirmationCode: number, trx?: IDBTransaction): Promise<IEmailVerifyResponse>;
    getEmailConfirmation(userId: number, email: string): Promise<IEmailConfirmationData | undefined>;
    deleteEmailConfirmation(userId: number, email: string): Promise<boolean>;
}
