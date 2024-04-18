import { IEmailConfirmationData } from './IEmailConfirmationData';

export interface IEmailConfirmationDataAccess {
    getUserConfirmation(userId: number, email: string): Promise<IEmailConfirmationData>;
    createUserConfirmation(payload: {
        userId: number;
        confirmationCode: number;
        email: string;
        expiresAt: Date;
    }): Promise<IEmailConfirmationData>;
    updateUserConfirmation(payload: {
        userId: number;
        confirmationCode: number;
        email: string;
        expiresAt: Date;
        confirmationId: number;
    }): Promise<IEmailConfirmationData>;
    confirmUserMail(payload: { userId: number; email: string; confirmationId: number }): Promise<IEmailConfirmationData>;
}
