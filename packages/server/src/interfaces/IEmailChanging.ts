export interface IEmailChanging {
    id: number;
    userId: number;
    confirmationCode: number;
    confirmed: boolean;
    email: string;
    createdAt: Date;
    expiresAt: Date;
}
