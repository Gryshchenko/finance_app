export interface IPasswordChanging {
    id: number;
    userId: number;
    confirmationCode: number;
    confirmed: boolean;
    passwordHash: string;
    salt: string;
    createdAt: Date;
    expiresAt: Date;
}
