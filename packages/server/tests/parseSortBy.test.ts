import { parseSortBy } from '../src/utils/validation/parseSortBy';

describe('parseSortBy', () => {
    const allowedFields = ['transactionId', 'amount', 'createdAt', 'currencyCode'];

    it('returns an empty array if sortBy is missing', () => {
        expect(parseSortBy(undefined, allowedFields)).toEqual([]);
        expect(parseSortBy('', allowedFields)).toEqual([]);
    });

    it('parses a single key with asc direction', () => {
        const result = parseSortBy('amount:asc', allowedFields);
        expect(result).toEqual([{ column: 'amount', order: 'asc' }]);
    });

    it('parses a single key with desc direction', () => {
        const result = parseSortBy('createdAt:desc', allowedFields);
        expect(result).toEqual([{ column: 'createdAt', order: 'desc' }]);
    });

    it('parses multiple keys', () => {
        const result = parseSortBy('amount:asc,createdAt:desc', allowedFields);
        expect(result).toEqual([
            { column: 'amount', order: 'asc' },
            { column: 'createdAt', order: 'desc' },
        ]);
    });

    it('throws an error if a field is not allowed', () => {
        expect(() => parseSortBy('invalid:asc', allowedFields)).toThrow('Invalid sort field: invalid');
    });

    it('throws an error if the direction is invalid', () => {
        expect(() => parseSortBy('amount:wrong', allowedFields)).toThrow('Invalid sort order: wrong for field: amount');
    });

    it('defaults to asc if the direction is not provided', () => {
        const result = parseSortBy('amount', allowedFields);
        expect(result).toEqual([{ column: 'amount', order: 'asc' }]);
    });

    it('is case-insensitive for direction', () => {
        const result = parseSortBy('amount:DESC', allowedFields);
        expect(result).toEqual([{ column: 'amount', order: 'desc' }]);
    });
});
