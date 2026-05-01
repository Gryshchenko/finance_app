export interface IPagination<T> {
    data: T[];
    cursor: string | null;
    limit: number;
}
