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
    }): Promise<IEmailConfirmationData>;
}
