export interface IDatabaseConnection {
    query<T>(sql: string, args: Array<unknown>): Promise<T>;
    close(): Promise<void>;
}
