import { IEmailConfirmationData } from './IEmailConfirmationData';
import { ITransaction } from 'interfaces/IDatabaseConnection';

export interface IEmailConfirmationService {
    sendConfirmationMailToUser(userId: number, email: string): Promise<IEmailConfirmationData>;
    getUserConfirmation(userId: number, code: number): Promise<IEmailConfirmationData | undefined>;
    deleteUserConfirmation(userId: number, code: number): Promise<boolean>;
    createConfirmationMail(userId: number, email: string, trx?: ITransaction): Promise<IEmailConfirmationData>;
}
