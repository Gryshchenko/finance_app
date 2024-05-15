export interface IEmailConfirmationData {
    confirmationId: number;
    userId: number;
    email: string;
    confirmationCode: number;
    confirmed: boolean;
    expiresAt: Date;
}
