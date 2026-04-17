export type OAuthProviderType = 'google' | 'apple';

export interface IOAuthUserInfo {
    providerId: string;
    email: string;
    emailVerified: boolean;
}

export interface IOAuthProvider {
    verify(idToken: string): Promise<IOAuthUserInfo>;
}
