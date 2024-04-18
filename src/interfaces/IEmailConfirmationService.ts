import { IEmailConfirmationData } from './IEmailConfirmationData';
import { IFailure } from './IFailure';
import { ISuccess } from './ISuccess';

export interface IEmailConfirmationService {
    sendConfirmationMail(userId: number, email: string): Promise<ISuccess<IEmailConfirmationData> | IFailure>;
    sendAgainConfirmationMail(userId: number, email: string): Promise<ISuccess<IEmailConfirmationData> | IFailure>;
    getUserConfirmation(userId: number, email: string): Promise<IEmailConfirmationData>;
    confirmUserMail(payload: { userId: number; email: string; confirmationId: number }): Promise<IEmailConfirmationData>;
}
