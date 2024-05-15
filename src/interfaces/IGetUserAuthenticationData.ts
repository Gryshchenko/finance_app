export interface IGetUserAuthenticationData {
    userId: number;
    email: string;
    passwordHash: string;
    salt: string;
}
