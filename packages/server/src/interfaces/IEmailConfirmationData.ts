export interface IEmailConfirmationData {
    confirmationId: number;
    userId: number;
    confirmationCode: number;
    confirmed: boolean;
    email: string;
    createdAt: Date;
    expiresAt: Date;
    status: number;
}
