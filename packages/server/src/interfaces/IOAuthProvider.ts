export interface IOAuthProviderRecord {
    id: number;
    userId: number;
    provider: string;
    providerId: string;
    email: string | null;
    createdAt: string;
}
