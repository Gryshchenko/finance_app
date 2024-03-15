export interface IEmailConfirmationService {
    sendConfirmationMail(userId: number, email: string): Promise<ISuccess<IEmailConfirmationData> | IFailure>;
}
