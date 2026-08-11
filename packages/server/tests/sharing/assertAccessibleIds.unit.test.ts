import { assertAccessibleIds } from '../../src/utils/resolveAccessibleItems';

describe('assertAccessibleIds', () => {
    it('throws when the resolver failed, so a query is never run unscoped', () => {
        expect(() => assertAccessibleIds(undefined, 'accounts')).toThrow();
    });

    it('passes an empty set through - "user owns nothing" is legitimate, not an error', () => {
        expect(assertAccessibleIds([], 'categories')).toEqual([]);
    });

    it('returns the ids untouched', () => {
        expect(assertAccessibleIds([3, 1, 2], 'incomes')).toEqual([3, 1, 2]);
    });
});
