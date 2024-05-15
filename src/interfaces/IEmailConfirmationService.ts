import { IEmailConfirmationData } from './IEmailConfirmationData';
import { IFailure } from './IFailure';
import { ISuccess } from './ISuccess';

export interface IEmailConfirmationService {
    sendConfirmationMail(userId: number, email: string): Promise<ISuccess<IEmailConfirmationData> | IFailure>;
    // sendAgainConfirmationMail(userId: number, email: string): Promise<ISuccess<IEmailConfirmationData> | IFailure>;
    getUserConfirmation(userId: number, code: number): Promise<IEmailConfirmationData | undefined>;
    deleteUserConfirmation(userId: number, code: number): Promise<boolean>;
}
