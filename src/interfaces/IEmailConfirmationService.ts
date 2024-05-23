import { IEmailConfirmationData } from './IEmailConfirmationData';
import { IFailure } from './IFailure';
import { ISuccess } from './ISuccess';
import { ITransaction } from 'interfaces/IDatabaseConnection';

export interface IEmailConfirmationService {
    sendConfirmationMailToUser(userId: number, email: string): Promise<ISuccess<IEmailConfirmationData> | IFailure>;
    getUserConfirmation(userId: number, code: number): Promise<IEmailConfirmationData | undefined>;
    deleteUserConfirmation(userId: number, code: number): Promise<boolean>;
    createConfirmationMail(
        userId: number,
        email: string,
        trx?: ITransaction,
    ): Promise<ISuccess<IEmailConfirmationData> | IFailure>;
}
