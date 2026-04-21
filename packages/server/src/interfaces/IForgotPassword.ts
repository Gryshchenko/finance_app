export interface IForgotPassword {
    id: number;
    userId: number;
    email: string;
    confirmationCode: number;
    confirmed: boolean;
    createdAt: Date;
    expiresAt: Date;
}
