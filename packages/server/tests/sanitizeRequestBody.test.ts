import { sanitizeRequestBody } from '../src/utils/validation/sanitizeRequestBody';
import { ErrorCode } from '@tenpercent/shared';
import { HttpCode } from '@tenpercent/shared';
import { ResponseStatusType } from '@tenpercent/shared';

describe('sanitizeRequestBody function', () => {
    const allowedFields = ['name', 'email'];

    it('should pass if body contains only allowed fields', () => {
        const req = { body: { name: 'John', email: 'john@example.com' } } as never;
        const res: { status: string; json: string } = { status: jest.fn().mockReturnThis(), json: jest.fn() } as never;
        const next = jest.fn();

        sanitizeRequestBody(allowedFields)(req, res as never, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject request with unexpected fields', () => {
        const req = { body: { name: 'John', email: 'john@example.com', age: 30 } } as never;
        const res: { status: string; json: string } = { status: jest.fn().mockReturnThis(), json: jest.fn() } as never;
        const next = jest.fn();

        sanitizeRequestBody(allowedFields)(req, res as never, next);

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

    it('should pass if request body is empty', () => {
        const req = { body: {} } as never;
        const res: { status: string; json: string } = { status: jest.fn().mockReturnThis(), json: jest.fn() } as never;
        const next = jest.fn();

        sanitizeRequestBody(allowedFields)(req, res as never, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle multiple unexpected fields correctly', () => {
        const req = { body: { name: 'John', email: 'john@example.com', age: 30, city: 'NY' } } as never;
        const res: { status: string; json: string } = { status: jest.fn().mockReturnThis(), json: jest.fn() } as never;
        const next = jest.fn();

        sanitizeRequestBody(allowedFields)(req, res as never, next);

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
});
