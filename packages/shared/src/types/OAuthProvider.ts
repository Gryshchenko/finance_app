/**
 * Identity providers accepted by `POST /auth/oauth`.
 *
 * Each value maps to a server-side verifier for the supplied `idToken`; a provider
 * with no verifier cannot be authenticated, so the set is closed rather than open.
 */
export enum OAuthProvider {
    Google = 'google',
    Apple = 'apple',
}

export const VALID_OAUTH_PROVIDERS: string[] = Object.values(OAuthProvider);
