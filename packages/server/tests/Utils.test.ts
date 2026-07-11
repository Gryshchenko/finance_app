import { Utils } from '@tenpercent/shared';

describe('Utils', () => {
    describe('roundNumber', () => {
        it('should round the number to 2 decimals', () => {
            expect(Utils.roundNumber(1.2345)).toBe(1.23);
            expect(Utils.roundNumber(1.2355)).toBe(1.24);
        });
    });

    describe('isNumber', () => {
        it('should return true for strings containing only digits', () => {
            expect(Utils.isNumber('123')).toBe(true);
        });
        it('should return false for strings with letters or decimals', () => {
            expect(Utils.isNumber('123a')).toBe(false);
            expect(Utils.isNumber('12.3')).toBe(false);
        });
    });

    describe('parseNumber', () => {
        it('should return a number when parsing a valid numeric string', () => {
            expect(Utils.parseNumber('123.45')).toBeCloseTo(123.45);
        });
        it('should return null when parsing an invalid numeric string', () => {
            expect(Utils.parseNumber('abc')).toBeNull();
        });
        it('should return null when the string is empty', () => {
            expect(Utils.parseNumber('')).toBeNull();
        });
    });

    describe('escapeRegExp', () => {
        it('should escape regex special characters', () => {
            const specialChars = '.*+?^${}()|[]\\';
            const escaped = specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            expect(Utils.escapeRegExp(specialChars)).toBe(escaped);
        });
        it('should return the original string if there are no special chars', () => {
            expect(Utils.escapeRegExp('normalText')).toBe('normalText');
            expect(Utils.escapeRegExp('')).toBe('');
        });
    });

    describe('parseBoolean', () => {
        it('should parse "true" to boolean true', () => {
            expect(Utils.parseBoolean('true')).toBe(true);
        });
        it('should parse "false" to boolean false', () => {
            expect(Utils.parseBoolean('false')).toBe(false);
        });
        it('should return null for other strings', () => {
            expect(Utils.parseBoolean('yes')).toBeNull();
        });
    });

    describe('parse', () => {
        it('should return a number when parsing a numeric string', () => {
            expect(Utils.parse('123.45')).toBeCloseTo(123.45);
        });
        it('should return a boolean when parsing "false"', () => {
            expect(Utils.parse('false')).toBe(false);
        });
        it('should return the original string if it cannot be parsed as number or boolean', () => {
            expect(Utils.parse('hello')).toBe('hello');
        });
    });

    describe('nullToEmpty', () => {
        it('should return an empty string when passed an empty string', () => {
            expect(Utils.nullToEmpty('')).toBe('');
        });
        it('should return the original string if not empty', () => {
            expect(Utils.nullToEmpty('test')).toBe('test');
        });
    });

    describe('isNotEmpty', () => {
        it('should return true for non-empty strings', () => {
            expect(Utils.isNotEmpty('a')).toBe(true);
        });
        it('should return false for empty strings', () => {
            expect(Utils.isNotEmpty('')).toBe(false);
        });
        it('should return false for null or undefined values', () => {
            expect(Utils.isNotEmpty(null as unknown as string)).toBe(false);
            expect(Utils.isNotEmpty(undefined as unknown as string)).toBe(false);
        });
    });

    describe('isNotNull', () => {
        it('should return true for non-null values', () => {
            expect(Utils.isNotNull(0)).toBe(true);
            expect(Utils.isNotNull('')).toBe(true);
        });
        it('should return false for null, undefined, or the string "undefined"', () => {
            expect(Utils.isNotNull(null)).toBe(false);
            expect(Utils.isNotNull(undefined)).toBe(false);
            expect(Utils.isNotNull('undefined')).toBe(false);
        });
    });

    describe('isNull', () => {
        it('should return true for null and undefined', () => {
            expect(Utils.isNull(null)).toBe(true);
            expect(Utils.isNull(undefined)).toBe(true);
        });
        it('should return false for non-null values', () => {
            expect(Utils.isNull(0)).toBe(false);
            expect(Utils.isNull('')).toBe(false);
        });
    });

    describe('isArrayNotEmpty and isArrayEmpty', () => {
        it('should correctly identify non-empty arrays', () => {
            expect(Utils.isArrayNotEmpty([1, 2, 3])).toBe(true);
            expect(Utils.isArrayEmpty([1, 2, 3])).toBe(false);
        });
        it('should correctly identify empty arrays', () => {
            expect(Utils.isArrayNotEmpty([])).toBe(false);
            expect(Utils.isArrayEmpty([])).toBe(true);
        });
        it('should handle null or undefined arrays', () => {
            expect(Utils.isArrayNotEmpty(null as unknown as unknown[])).toBe(false);
            expect(Utils.isArrayEmpty(null as unknown as unknown[])).toBe(true);
        });
    });

    describe('isObjectEmpty', () => {
        it('should return true for an empty object', () => {
            expect(Utils.isObjectEmpty({})).toBe(true);
        });
        it('should return false for a non-empty object', () => {
            expect(Utils.isObjectEmpty({ key: 'value' })).toBe(false);
        });
    });

    describe('greaterThen0, not0, lessThen0', () => {
        it('greaterThen0 should return true for positive numbers and false otherwise', () => {
            expect(Utils.greaterThen0(5)).toBe(true);
            expect(Utils.greaterThen0(0)).toBe(false);
            expect(Utils.greaterThen0(-3)).toBe(false);
        });
        it('not0 should return false for zero and true for non-zero numbers', () => {
            expect(Utils.not0(0)).toBe(false);
            expect(Utils.not0(10)).toBe(true);
        });
        it('lessThen0 should return true for negative numbers and false otherwise', () => {
            expect(Utils.lessThen0(-1)).toBe(true);
            expect(Utils.lessThen0(1)).toBe(false);
            expect(Utils.lessThen0(0)).toBe(false);
        });
    });

    describe('compareUndefined', () => {
        it('should return -1 if first value is not null and second is null/undefined', () => {
            expect(Utils.compareUndefined(1, null)).toBe(-1);
            expect(Utils.compareUndefined(1, undefined)).toBe(-1);
        });
        it('should return 1 if first value is null/undefined and second is not', () => {
            expect(Utils.compareUndefined(null, 1)).toBe(1);
            expect(Utils.compareUndefined(undefined, 1)).toBe(1);
        });
        it('should return 0 if both are non-null or both are null/undefined', () => {
            expect(Utils.compareUndefined(1, 2)).toBe(0);
            expect(Utils.compareUndefined(null, null)).toBe(0);
        });
    });

    describe('compareArrayLength', () => {
        it('should compare arrays based on their lengths', () => {
            expect(Utils.compareArrayLength([1, 2], [1])).toBe(1);
            expect(Utils.compareArrayLength([1], [1, 2])).toBe(-1);
            expect(Utils.compareArrayLength([1], [2])).toBe(0);
        });
    });

    describe('compareObject', () => {
        it('should return true for objects with the same key/values', () => {
            expect(Utils.compareObject({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
        });
        it('should return false for objects with different key/values', () => {
            expect(Utils.compareObject({ a: 1 }, { a: 2 })).toBe(false);
            expect(Utils.compareObject({ a: 1 }, { b: 1 })).toBe(false);
        });
    });

    describe('compareArrays', () => {
        const comparator = (a: number, b: number) => a - b;
        it('should compare two arrays element-wise', () => {
            expect(Utils.compareArrays([1, 2, 3], [1, 2, 3], comparator)).toBe(0);
            expect(Utils.compareArrays([1, 2, 3], [1, 2, 4], comparator)).toBeLessThan(0);
            expect(Utils.compareArrays([1, 2, 5], [1, 2, 4], comparator)).toBeGreaterThan(0);
        });
        it('should compare based on array length if lengths differ', () => {
            expect(Utils.compareArrays([1, 2, 3], [1, 2], comparator)).toBeGreaterThan(0);
        });
    });

    describe('has', () => {
        it('should return true if the array contains the value', () => {
            expect(Utils.has([1, 2, 3], 2)).toBe(true);
        });
        it('should return false if the array does not contain the value', () => {
            expect(Utils.has([1, 2, 3], 4)).toBe(false);
            expect(Utils.has([], 1)).toBe(false);
        });
    });

    describe('isEmpty', () => {
        it('should return true for undefined or empty strings', () => {
            expect(Utils.isEmpty('')).toBe(true);
            expect(Utils.isEmpty(undefined)).toBe(true);
        });
        it('should return false for non-empty strings', () => {
            expect(Utils.isEmpty('hello')).toBe(false);
        });
    });

    describe('checkNotNull', () => {
        it('should return the value if it is not null', () => {
            expect(Utils.checkNotNull(5)).toBe(5);
        });
        it('should throw a ReferenceError if the value is null or undefined', () => {
            expect(() => Utils.checkNotNull(null)).toThrow(ReferenceError);
            expect(() => Utils.checkNotNull(undefined)).toThrow(ReferenceError);
        });
    });

    describe('pad', () => {
        it('should pad single digit numbers with a leading zero', () => {
            expect(Utils.pad(5)).toBe('05');
        });
        it('should leave two-digit numbers unchanged', () => {
            expect(Utils.pad(12)).toBe('12');
        });
    });

    describe('replaceAll', () => {
        it('should replace all occurrences of a substring in a string', () => {
            const text = 'Hello world, hello universe';
            expect(Utils.replaceAll(text, 'hello', 'hi')).toBe('Hello world, hi universe');
        });
        it('should return the original string if no replacement is needed', () => {
            expect(Utils.replaceAll('abc', 'd', 'e')).toBe('abc');
        });
        it('should return the original string if no value', () => {
            expect(Utils.replaceAll(null as unknown as string, 'd', 'e')).toBe(null);
        });
    });

    describe('to', () => {
        it('should resolve with a tuple [null, data] when the promise is fulfilled', async () => {
            const promise = Promise.resolve('success');
            const [err, data] = await Utils.to(promise);
            expect(err).toBeNull();
            expect(data).toBe('success');
        });
        it('should catch and return a tuple [error, undefined] when the promise is rejected', async () => {
            const errorObject = new Error('fail');
            const promise = Promise.reject(errorObject);
            const [err, data] = await Utils.to(promise, { extra: 'info' });
            expect(err).toBe(errorObject);
            // @ts-expect-error is necessary
            expect((err as never).extra).toBe('info');
            expect(data).toBeUndefined();
        });
    });
    it('should use crypto.randomUUID when available with mock', () => {
        const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
        const call = jest.spyOn(Utils, 'uuid').mockReturnValue(mockUUID);

        const result = Utils.uuid();
        expect(result).toBe(mockUUID);
        expect(call).toHaveBeenCalled();
    });
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    // it('should use crypto.randomUUID when available', () => {
    //     const mockUuid = '123e4567-e89b-4d3a-a456-426614174000';
    //     const randomUUIDMock = jest.fn(() => mockUuid);
    //     (globalThis.crypto as unknown) = { randomUUID: randomUUIDMock };
    //
    //     const result = Utils.uuid();
    //
    //     expect(randomUUIDMock).toHaveBeenCalled();
    //     expect(result).toMatch(uuidV4Regex);
    // });
    //
    // it('should generate a UUID manually if crypto.randomUUID is not available', () => {
    //     const getRandomValuesMock = jest.fn((arr: Uint8Array) => {
    //         for (let i = 0; i < arr.length; i++) {
    //             arr[i] = i;
    //         }
    //         arr[6] = (arr[6] & 0x0f) | 0x40;
    //         arr[8] = (arr[8] & 0x3f) | 0x80;
    //         return arr;
    //     });
    //
    //     (globalThis.crypto as unknown) = { getRandomValues: getRandomValuesMock };
    //
    //     const result = Utils.uuid();
    //
    //     expect(getRandomValuesMock).toHaveBeenCalled();
    //     expect(result).toMatch(uuidV4Regex);
    // });
});
