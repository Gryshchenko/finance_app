export interface IEmailResendResponse {
    confirmationId: number;
    confirmed: boolean;
    expiresAt: string;
}
