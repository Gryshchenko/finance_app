import { VALID_COLOR_IDS, VALID_ICON_IDS } from '@tenpercent/shared';

import { SUPPORTED_CURRENCY_CODES, SUPPORTED_LOCALES } from 'src/config/appConfigFile';

/**
 * One vocabulary for describing accepted input, shared by the query string
 * (`validateQuery`) and the request body (`sanitizeRequestBody`).
 *
 * Both middlewares are closed by construction: a field that is not in the schema is
 * rejected, and a field that is in the schema is checked against its spec. There is no
 * "declared but unconstrained" state - every spec carries a type, and every type has a
 * bound (numbers have min/max, strings have a length cap, enums have their member list).
 *
 * The two middlewares differ only in where the value comes from. Query values always
 * arrive as strings and are parsed; body values arrive as parsed JSON and are checked
 * strictly, so `{ "amount": "100" }` is a type error rather than a silent coercion.
 */

export type FieldType = 'number' | 'integer' | 'string' | 'date' | 'boolean' | 'array' | 'object';

export interface IFieldSpec {
    type: FieldType;
    /** absent value is accepted; a `default` implies optional as well */
    optional?: boolean;
    /** inclusive lower bound, numeric types only */
    min?: number;
    /** inclusive upper bound, numeric types only */
    max?: number;
    /** exclusive lower bound, numeric types only (amounts that must be positive) */
    gt?: number;
    /** minimum characters (string) or elements (array) */
    minLength?: number;
    /** maximum characters (string) or elements (array); strings fall back to `FIELD_LIMITS.MAX_STRING_LENGTH` */
    maxLength?: number;
    /** closed set of accepted values, string and numeric types */
    allowedValues?: readonly (string | number)[];
    /** additional shape constraint for strings, applied after the length check */
    pattern?: RegExp;
    /** written into `req.query` when a query parameter is absent, so controllers never read `undefined` */
    default?: number | string;
    /** element spec, `array` only - every element is checked against it */
    items?: IFieldSpec;
    /** property specs, `object` only - unknown properties are rejected exactly as at the top level */
    properties?: Record<string, IFieldSpec>;
}

/** `'string'`, `'date?'` and `'?number'` shorthands are still accepted for fields with nothing to constrain. */
export type FieldSchema = Record<string, string | IFieldSpec>;

export const FIELD_LIMITS = {
    MIN_PAGE_SIZE: 1,
    /** page size used when a caller does not ask for one */
    DEFAULT_PAGE_SIZE: 20,
    /**
     * Hard ceiling on any page size. A larger request is rejected with 400 rather than
     * silently clamped, so a client asking for more than it can get finds out.
     */
    MAX_PAGE_SIZE: 100,
    /** cap applied to every string that does not set its own `maxLength` */
    MAX_STRING_LENGTH: 500,
    /** base64 cursors run ~60 characters; the cap leaves headroom without allowing a payload */
    MAX_CURSOR_LENGTH: 256,
    /** cap applied to every array that does not set its own `maxLength` */
    MAX_ARRAY_LENGTH: 100,
    /** longest entity name the schema accepts anywhere */
    MAX_NAME_LENGTH: 128,
    /**
     * Confirmation codes are 8 digits, but `ConfirmationHelper.generateCode` zero-pads
     * and then parses back to a number, so a generated code can carry fewer than 8
     * significant digits. The lower bound is therefore 0, not 10000000.
     */
    CONFIRMATION_CODE_MIN: 0,
    CONFIRMATION_CODE_MAX: 99999999,
} as const;

const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

interface RuleOptions {
    optional?: boolean;
}

// ─── numbers ──────────────────────────────────────────────────────────────────

/** Whole number within an explicit range. */
export const intRule = (options: RuleOptions & { min: number; max: number; default?: number }): IFieldSpec => ({
    type: 'integer',
    optional: options.optional ?? false,
    min: options.min,
    max: options.max,
    default: options.default,
});

/** Monetary or fractional value. `gt` expresses "must be positive" without excluding 0.01. */
export const numberRule = (options: RuleOptions & { min?: number; max?: number; gt?: number } = {}): IFieldSpec => ({
    type: 'number',
    optional: options.optional ?? false,
    min: options.min ?? Number.MIN_SAFE_INTEGER,
    max: options.max ?? Number.MAX_SAFE_INTEGER,
    gt: options.gt,
});

/** Row id used as a reference or filter. Optional by default - an absent filter means "do not filter". */
export const idRule = (options: RuleOptions = {}): IFieldSpec => ({
    type: 'integer',
    optional: options.optional ?? true,
    min: 1,
    max: Number.MAX_SAFE_INTEGER,
});

/** Ordering index within a list; 0 is the first slot. */
export const positionRule = (options: RuleOptions = {}): IFieldSpec => ({
    type: 'integer',
    optional: options.optional ?? true,
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
});

/**
 * Page size for a cursor-paginated list endpoint. Required by default, because the
 * `/transactions` contract requires it; pass `optional` (with a `default`) for endpoints
 * that page without being asked to.
 */
export const limitRule = (options: RuleOptions & { max?: number; default?: number } = {}): IFieldSpec => ({
    type: 'integer',
    optional: options.optional ?? false,
    min: FIELD_LIMITS.MIN_PAGE_SIZE,
    max: options.max ?? FIELD_LIMITS.MAX_PAGE_SIZE,
    default: options.default,
});

// ─── strings ──────────────────────────────────────────────────────────────────

/** Free text with an explicit length window. */
export const stringRule = (
    options: RuleOptions & { minLength?: number; maxLength?: number; pattern?: RegExp } = {},
): IFieldSpec => ({
    type: 'string',
    optional: options.optional ?? false,
    minLength: options.minLength ?? 1,
    maxLength: options.maxLength ?? FIELD_LIMITS.MAX_STRING_LENGTH,
    pattern: options.pattern,
});

/** Closed set of values. The member list doubles as the length cap. */
export const enumRule = (allowedValues: readonly (string | number)[], options: RuleOptions = {}): IFieldSpec => {
    const isNumeric = allowedValues.every((value) => typeof value === 'number');
    return {
        type: isNumeric ? 'integer' : 'string',
        optional: options.optional ?? true,
        allowedValues,
        maxLength: isNumeric ? undefined : Math.max(...allowedValues.map((value) => String(value).length), 1),
    };
};

/** Opaque pagination cursor: length-capped here, decoded and verified by the data access layer. */
export const cursorRule = (): IFieldSpec => ({
    type: 'string',
    optional: true,
    minLength: 1,
    maxLength: FIELD_LIMITS.MAX_CURSOR_LENGTH,
});

/**
 * Currency code, restricted to the catalogue in `public/config.json` - the same list the
 * clients fetch and offer. A shape check (`^[A-Z]{3}$`) would accept `XYZ`, which no part
 * of the system can do anything with; the catalogue is the actual answer to "is this a
 * currency we support".
 *
 * Membership here does not imply a row in the `currencies` table or a known rate:
 * `createCurrencyCodeExistsRule` and the exchange-rate 404 still apply.
 */
export const currencyCodeRule = (options: RuleOptions = {}): IFieldSpec =>
    enumRule(SUPPORTED_CURRENCY_CODES, { optional: options.optional ?? false });

/** BCP-47 tag restricted to the locales the app ships translations for. */
export const localeRule = (options: RuleOptions = {}): IFieldSpec =>
    enumRule(SUPPORTED_LOCALES, { optional: options.optional ?? true });

/** Entity display name (account, income, category, group). */
export const nameRule = (options: RuleOptions & { minLength?: number; maxLength?: number } = {}): IFieldSpec =>
    stringRule({
        optional: options.optional,
        minLength: options.minLength ?? 1,
        maxLength: options.maxLength ?? FIELD_LIMITS.MAX_NAME_LENGTH,
    });

/** Icon identifier drawn from the shipped icon set. */
export const iconRule = (options: RuleOptions = {}): IFieldSpec => enumRule(VALID_ICON_IDS, options);

/** Palette entry from the shipped colour set. */
export const colorRule = (options: RuleOptions = {}): IFieldSpec => enumRule(VALID_COLOR_IDS, options);

/** `#rgb` or `#rrggbb`. */
export const hexColorRule = (options: RuleOptions = {}): IFieldSpec =>
    stringRule({ optional: options.optional, minLength: 4, maxLength: 7, pattern: HEX_COLOR_PATTERN });

/**
 * Address shape only. Deliverability, normalisation and the "already registered" check
 * stay in the express-validator rules, which own the domain error codes.
 */
export const emailRule = (options: RuleOptions & { maxLength?: number } = {}): IFieldSpec =>
    stringRule({ optional: options.optional, minLength: 3, maxLength: options.maxLength ?? 150 });

/**
 * Secret material supplied by the client (password, JWT, provider id token).
 *
 * Only bounded here - strength and signature checks belong to the rules that can
 * produce the right error code. The upper bound matters on its own: an unbounded
 * password reaches bcrypt, and an unbounded token reaches the JWT parser.
 */
export const secretRule = (options: RuleOptions & { maxLength?: number } = {}): IFieldSpec =>
    stringRule({ optional: options.optional, minLength: 1, maxLength: options.maxLength ?? 4096 });

/** ISO-8601 instant. Parsed with `Time.parseUTC` by the middleware. */
export const dateRule = (options: RuleOptions = {}): IFieldSpec => ({
    type: 'date',
    optional: options.optional ?? false,
    maxLength: 64,
});

/** Emailed confirmation code, sent as a number. See `FIELD_LIMITS.CONFIRMATION_CODE_MIN`. */
export const confirmationCodeRule = (options: RuleOptions = {}): IFieldSpec => ({
    type: 'integer',
    optional: options.optional ?? false,
    min: FIELD_LIMITS.CONFIRMATION_CODE_MIN,
    max: FIELD_LIMITS.CONFIRMATION_CODE_MAX,
});

// ─── composites ───────────────────────────────────────────────────────────────

export const boolRule = (options: RuleOptions = {}): IFieldSpec => ({
    type: 'boolean',
    optional: options.optional ?? true,
});

/** Homogeneous list. Every element is checked against `items`, and the length is capped. */
export const arrayRule = (
    items: IFieldSpec,
    options: RuleOptions & { minLength?: number; maxLength?: number } = {},
): IFieldSpec => ({
    type: 'array',
    optional: options.optional ?? true,
    items,
    minLength: options.minLength ?? 0,
    maxLength: options.maxLength ?? FIELD_LIMITS.MAX_ARRAY_LENGTH,
});

/** Nested object with a closed property set - unknown properties are rejected as at the top level. */
export const objectRule = (properties: Record<string, IFieldSpec>, options: RuleOptions = {}): IFieldSpec => ({
    type: 'object',
    optional: options.optional ?? true,
    properties,
});

// ─── runtime helpers ──────────────────────────────────────────────────────────

/**
 * Last line of defence in front of `.limit()`.
 *
 * `validateQuery` already rejects an out-of-range `limit`, but a data access method is
 * also reachable from jobs and from other services, so the value is clamped again here
 * rather than trusted. Anything unparseable falls back to the default page size instead
 * of reaching the driver.
 */
export const resolvePageSize = (value: unknown, max: number = FIELD_LIMITS.MAX_PAGE_SIZE): number => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return FIELD_LIMITS.DEFAULT_PAGE_SIZE;
    }
    const truncated = Math.trunc(parsed);
    if (truncated < FIELD_LIMITS.MIN_PAGE_SIZE) {
        return FIELD_LIMITS.MIN_PAGE_SIZE;
    }
    return Math.min(truncated, max);
};

/** Expands the `'string'` / `'date?'` / `'?number'` shorthand into a full spec. */
export const normalizeSpec = (spec: string | IFieldSpec): IFieldSpec => {
    if (typeof spec !== 'string') {
        return spec;
    }
    return { type: spec.replace('?', '') as FieldType, optional: spec.includes('?') };
};
