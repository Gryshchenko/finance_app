import { HttpCode } from '@tenpercent/shared';
import { Request, Response } from 'express';

import { cursorRule, idRule, limitRule, FIELD_LIMITS, resolvePageSize } from '../src/utils/validation/fieldRules';
import { validateQuery } from '../src/utils/validation/validateQuery';

type QueryValue = string | string[] | Record<string, string> | undefined;

const run = (schema: Parameters<typeof validateQuery>[0], query: Record<string, QueryValue>) => {
    const req = { query } as unknown as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const next = jest.fn();

    validateQuery(schema)(req, res, next);

    return { req, res, next };
};

const listSchema = {
    cursor: cursorRule(),
    limit: limitRule(),
    accountId: idRule(),
};

describe('validateQuery - pagination bounds', () => {
    it('accepts a limit inside the allowed range', () => {
        const { next, res } = run(listSchema, { limit: '20' });

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('accepts the maximum page size', () => {
        const { next } = run(listSchema, { limit: String(FIELD_LIMITS.MAX_PAGE_SIZE) });

        expect(next).toHaveBeenCalled();
    });

    it('rejects a limit above the maximum page size', () => {
        const { next, res } = run(listSchema, { limit: '100000000' });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects a negative limit', () => {
        const { next, res } = run(listSchema, { limit: '-1' });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects a zero limit', () => {
        const { next, res } = run(listSchema, { limit: '0' });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects a fractional limit', () => {
        const { next, res } = run(listSchema, { limit: '0.5' });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it.each(['', ' ', '1e3', '0x10', 'Infinity', 'abc'])('rejects limit=%p', (limit) => {
        const { next, res } = run(listSchema, { limit });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects a missing required limit', () => {
        const { next, res } = run(listSchema, {});

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects a repeated limit parameter', () => {
        const { next, res } = run(listSchema, { limit: ['10', '99999'] });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects a nested object parameter instead of stringifying it', () => {
        const { next, res } = run(listSchema, { limit: '10', cursor: { a: 'b' } });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });
});

describe('validateQuery - normalisation', () => {
    it('normalises a padded numeric value', () => {
        const { req, next } = run(listSchema, { limit: '+07' });

        expect(next).toHaveBeenCalled();
        expect(req.query.limit).toBe('7');
    });

    it('substitutes a declared default for an absent parameter', () => {
        const { req, next } = run({ limit: limitRule({ optional: true, default: FIELD_LIMITS.DEFAULT_PAGE_SIZE }) }, {});

        expect(next).toHaveBeenCalled();
        expect(req.query.limit).toBe('20');
    });

    it('leaves an absent optional parameter absent', () => {
        const { req, next } = run(listSchema, { limit: '10' });

        expect(next).toHaveBeenCalled();
        expect(req.query.cursor).toBeUndefined();
    });
});

describe('validateQuery - strings and unexpected parameters', () => {
    it('rejects a cursor longer than the cursor cap', () => {
        const { next, res } = run(listSchema, { limit: '10', cursor: 'a'.repeat(FIELD_LIMITS.MAX_CURSOR_LENGTH + 1) });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects a string longer than the default cap', () => {
        const { next, res } = run({ scope: 'string?' }, { scope: 'a'.repeat(FIELD_LIMITS.MAX_STRING_LENGTH + 1) });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects a value outside the allowed set', () => {
        const { next, res } = run({ period: { type: 'string', allowedValues: ['day', 'month'] } }, { period: 'century' });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects an undeclared parameter', () => {
        const { next, res } = run(listSchema, { limit: '10', foo: 'bar' });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects an inherited Object.prototype key as undeclared', () => {
        const { next, res } = run(listSchema, { limit: '10', constructor: 'x' });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('still accepts the shorthand schema form', () => {
        const { next, res } = run({ currency: 'string', date: '?date' }, { currency: 'USD' });

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });
});

describe('resolvePageSize', () => {
    it('caps a page size at the maximum', () => {
        expect(resolvePageSize(100000000)).toBe(FIELD_LIMITS.MAX_PAGE_SIZE);
    });

    it('raises a page size below the minimum', () => {
        expect(resolvePageSize(0)).toBe(FIELD_LIMITS.MIN_PAGE_SIZE);
        expect(resolvePageSize(-1)).toBe(FIELD_LIMITS.MIN_PAGE_SIZE);
    });

    it('truncates a fractional page size', () => {
        expect(resolvePageSize(10.9)).toBe(10);
    });

    it('falls back to the default page size for an unparseable value', () => {
        expect(resolvePageSize(undefined)).toBe(FIELD_LIMITS.DEFAULT_PAGE_SIZE);
        expect(resolvePageSize('abc')).toBe(FIELD_LIMITS.DEFAULT_PAGE_SIZE);
        expect(resolvePageSize(NaN)).toBe(FIELD_LIMITS.DEFAULT_PAGE_SIZE);
        expect(resolvePageSize(Infinity)).toBe(FIELD_LIMITS.DEFAULT_PAGE_SIZE);
    });

    it('passes an in-range page size through', () => {
        expect(resolvePageSize('50')).toBe(50);
    });
});
