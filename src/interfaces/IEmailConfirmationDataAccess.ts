import { IEmailConfirmationData } from './IEmailConfirmationData';

export interface IEmailConfirmationDataAccess {
    getUserConfirmationWithCode(userId: number, code: number): Promise<IEmailConfirmationData | undefined>;
    getUserConfirmationWithEmail(userId: number, email: string): Promise<IEmailConfirmationData | undefined>;
    createUserConfirmation(payload: {
        userId: number;
        confirmationCode: number;
        email: string;
        expiresAt: Date;
    }): Promise<IEmailConfirmationData>;
    deleteUserConfirmation(userId: number, code: number): Promise<boolean>;
}
