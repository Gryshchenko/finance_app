export type QueryParamType = 'number' | 'integer' | 'string' | 'date';

export interface IQueryParamSpec {
    type: QueryParamType;
    /** absent parameter is accepted; a `default` makes a parameter optional as well */
    optional?: boolean;
    /** inclusive lower bound, numeric types only */
    min?: number;
    /** inclusive upper bound, numeric types only */
    max?: number;
    /** maximum characters, string type only; falls back to `QUERY_LIMITS.MAX_STRING_LENGTH` */
    maxLength?: number;
    /** whitelist of accepted values, string type only */
    allowedValues?: readonly string[];
    /** written into `req.query` when the parameter is absent, so controllers never read `undefined` */
    default?: number | string;
}

export type QuerySchema = Record<string, string | IQueryParamSpec>;

export const QUERY_LIMITS = {
    MIN_PAGE_SIZE: 1,
    /** page size used when a caller does not ask for one */
    DEFAULT_PAGE_SIZE: 20,
    /**
     * Hard ceiling on any page size. A larger request is rejected with 400 rather than
     * silently clamped, so a client asking for more than it can get finds out.
     */
    MAX_PAGE_SIZE: 100,
    /** cap applied to every string parameter that does not set its own `maxLength` */
    MAX_STRING_LENGTH: 500,
    /** base64 cursors run ~60 characters; the cap leaves headroom without allowing a payload */
    MAX_CURSOR_LENGTH: 256,
} as const;

export const limitRule = (options: { optional?: boolean; max?: number; default?: number } = {}): IQueryParamSpec => ({
    type: 'integer',
    optional: options.optional ?? false,
    min: QUERY_LIMITS.MIN_PAGE_SIZE,
    max: options.max ?? QUERY_LIMITS.MAX_PAGE_SIZE,
    default: options.default,
});

export const cursorRule = (): IQueryParamSpec => ({
    type: 'string',
    optional: true,
    maxLength: QUERY_LIMITS.MAX_CURSOR_LENGTH,
});

export const idRule = (options: { optional?: boolean } = {}): IQueryParamSpec => ({
    type: 'integer',
    optional: options.optional ?? true,
    min: 1,
    max: Number.MAX_SAFE_INTEGER,
});

export const enumRule = (allowedValues: readonly string[], options: { optional?: boolean } = {}): IQueryParamSpec => ({
    type: 'string',
    optional: options.optional ?? true,
    allowedValues,
    maxLength: Math.max(...allowedValues.map((value) => value.length), 1),
});

export const resolvePageSize = (value: unknown, max: number = QUERY_LIMITS.MAX_PAGE_SIZE): number => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return QUERY_LIMITS.DEFAULT_PAGE_SIZE;
    }
    const truncated = Math.trunc(parsed);
    if (truncated < QUERY_LIMITS.MIN_PAGE_SIZE) {
        return QUERY_LIMITS.MIN_PAGE_SIZE;
    }
    return Math.min(truncated, max);
};
