import { ErrorCode, HttpCode, ResponseStatusType, VALID_GOAL_IDS } from '@tenpercent/shared';
import { Request, Response } from 'express';

import { SUPPORTED_CURRENCY_CODES } from '../src/config/appConfigFile';
import {
    arrayRule,
    boolRule,
    currencyCodeRule,
    emailRule,
    enumRule,
    hexColorRule,
    idRule,
    nameRule,
    numberRule,
    objectRule,
} from '../src/utils/validation/fieldRules';
import { sanitizeRequestBody } from '../src/utils/validation/sanitizeRequestBody';

const run = (schema: Parameters<typeof sanitizeRequestBody>[0], body: unknown) => {
    const req = { body } as unknown as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const next = jest.fn();

    sanitizeRequestBody(schema)(req, res, next);

    return { req, res, next };
};

const personSchema = { name: nameRule(), email: emailRule() };

describe('sanitizeRequestBody - unexpected fields', () => {
    it('should pass if body contains only allowed fields', () => {
        const { next, res } = run(personSchema, { name: 'John', email: 'john@example.com' });

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject request with unexpected fields', () => {
        const { next, res } = run(personSchema, { name: 'John', email: 'john@example.com', age: 30 });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(res.json).toHaveBeenCalledWith({
            status: ResponseStatusType.INTERNAL,
            data: {},
            errors: [
                {
                    errorCode: ErrorCode.UNEXPECTED_PROPERTY,
                    payload: {
                        fields: 'age',
                    },
                },
            ],
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should pass if the schema and the request body are both empty', () => {
        const { next, res } = run({}, {});

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject any field when the schema is empty', () => {
        const { next, res } = run({}, { anything: 1 });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('should handle multiple unexpected fields correctly', () => {
        const { next, res } = run(personSchema, { name: 'John', email: 'john@example.com', age: 30, city: 'NY' });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(res.json).toHaveBeenCalledWith({
            status: ResponseStatusType.INTERNAL,
            data: {},
            errors: [
                {
                    errorCode: ErrorCode.UNEXPECTED_PROPERTY,
                    payload: {
                        fields: 'age,city',
                    },
                },
            ],
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should reject an inherited Object.prototype key', () => {
        const { next, res } = run(personSchema, { name: 'John', email: 'john@example.com', constructor: 'x' });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });
});

describe('sanitizeRequestBody - declared fields are typed', () => {
    it('rejects a missing required field', () => {
        const { next, res } = run(personSchema, { name: 'John' });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('accepts an absent optional field', () => {
        const { next } = run({ keepData: boolRule() }, {});

        expect(next).toHaveBeenCalled();
    });

    it('treats an explicit null as absent, so an optional field still passes', () => {
        const { next } = run({ keepData: boolRule() }, { keepData: null });

        expect(next).toHaveBeenCalled();
    });

    it('rejects an explicit null for a required field', () => {
        const { next, res } = run({ userGroupId: idRule({ optional: false }) }, { userGroupId: null });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it.each([['1' as unknown], [{}], [[]], [1]])('rejects a non-boolean keepData: %p', (keepData) => {
        const { next, res } = run({ keepData: boolRule() }, { keepData });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('accepts a boolean keepData', () => {
        const { next } = run({ keepData: boolRule() }, { keepData: true });

        expect(next).toHaveBeenCalled();
    });

    it('rejects a numeric string where a number is declared', () => {
        const { next, res } = run({ amount: numberRule() }, { amount: '100' });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects a fractional id', () => {
        const { next, res } = run({ userGroupId: idRule({ optional: false }) }, { userGroupId: 1.5 });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects an id below the minimum', () => {
        const { next, res } = run({ userGroupId: idRule({ optional: false }) }, { userGroupId: 0 });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects a value outside a declared enum', () => {
        const { next, res } = run({ provider: enumRule(['google', 'apple']) }, { provider: 'facebook' });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects a name longer than its cap', () => {
        const { next, res } = run({ name: nameRule() }, { name: 'a'.repeat(129) });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects a lowercase currency code', () => {
        const { next, res } = run({ currencyCode: currencyCodeRule() }, { currencyCode: 'usd' });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects a well-formed code that is not in the supported catalogue', () => {
        const { next, res } = run({ currencyCode: currencyCodeRule() }, { currencyCode: 'XYZ' });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it.each(SUPPORTED_CURRENCY_CODES)('accepts the supported currency %s', (currencyCode) => {
        const { next } = run({ currencyCode: currencyCodeRule() }, { currencyCode });

        expect(next).toHaveBeenCalled();
    });
});

describe('sanitizeRequestBody - arrays and nested objects', () => {
    const goalsSchema = {
        selectedGoals: arrayRule(enumRule(VALID_GOAL_IDS, { optional: false }), {
            optional: false,
            maxLength: VALID_GOAL_IDS.length,
        }),
    };

    it('accepts a list of known goals', () => {
        const { next } = run(goalsSchema, { selectedGoals: ['save', 'grow'] });

        expect(next).toHaveBeenCalled();
    });

    it('rejects an unknown goal', () => {
        const { next, res } = run(goalsSchema, { selectedGoals: ['save', 'take-over-the-world'] });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects a goal list longer than the goal set', () => {
        const { next, res } = run(goalsSchema, { selectedGoals: new Array(VALID_GOAL_IDS.length + 1).fill('save') });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects a non-array where an array is declared', () => {
        const { next, res } = run(goalsSchema, { selectedGoals: 'save' });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    const avatarSchema = {
        avatar: objectRule({
            variant: enumRule(['beam', 'marble'], { optional: false }),
            colors: arrayRule(hexColorRule({ optional: false }), { optional: false, minLength: 1, maxLength: 10 }),
        }),
    };

    it('accepts a well-formed nested object', () => {
        const { next } = run(avatarSchema, { avatar: { variant: 'beam', colors: ['#fff', '#0A0310'] } });

        expect(next).toHaveBeenCalled();
    });

    it('rejects an unknown property nested inside an object', () => {
        const { next, res } = run(avatarSchema, { avatar: { variant: 'beam', colors: ['#fff'], hack: true } });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects a malformed colour inside a nested array', () => {
        const { next, res } = run(avatarSchema, { avatar: { variant: 'beam', colors: ['red'] } });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects an array where an object is declared', () => {
        const { next, res } = run(avatarSchema, { avatar: ['beam'] });

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });
});
