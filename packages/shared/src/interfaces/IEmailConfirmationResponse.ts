export interface IEmailConfirmationResponse {
    confirmationId: number;
    confirmed: boolean;
    expiresAt: string;
}
