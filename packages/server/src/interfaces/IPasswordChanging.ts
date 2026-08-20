/**
 * A pending password change. The new password is deliberately absent: it is supplied on the
 * final `apply` call and never stored, so no row can ever be replayed to set a password the
 * user has since moved on from.
 */
export interface IPasswordChanging {
    id: number;
    userId: number;
    confirmationCode: number;
    confirmed: boolean;
    createdAt: Date;
    expiresAt: Date;
}
