import { IEmailConfirmationData } from './IEmailConfirmationData';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';

export interface IEmailConfirmationDataAccess {
    getUserConfirmationWithCode(userId: number, code: number): Promise<IEmailConfirmationData | undefined>;
    getUserConfirmationWithEmail(userId: number, email: string): Promise<IEmailConfirmationData | undefined>;
    createUserConfirmation(
        payload: {
            userId: number;
            confirmationCode: number;
            email: string;
            expiresAt: Date;
        },
        trx?: IDBTransaction,
    ): Promise<IEmailConfirmationData>;
    deleteUserConfirmation(userId: number, code: number): Promise<boolean>;
}
