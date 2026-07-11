import { CustomError } from '../src/utils/errors/CustomError';
import { DBError } from '../src/utils/errors/DBError';
import { NotFoundError } from '../src/utils/errors/NotFoundError';
import { ValidationError } from '../src/utils/errors/ValidationError';
import { BaseError } from '../src/utils/errors/BaseError';
import { isBaseError } from '../src/utils/errors/isBaseError';
import { HttpCode } from '@tenpercent/shared';
import { ErrorCode } from '@tenpercent/shared';

describe('Error Classes', () => {
    const errorData = {
        message: 'Test error',
        statusCode: HttpCode.BAD_REQUEST,
        errorCode: ErrorCode.TRANSACTION_ERROR,
    };

    it('should create a CustomError instance correctly', () => {
        const error = new CustomError(errorData);
        expect(error.message).toBe(errorData.message);
        expect(error.getStatusCode()).toBe(errorData.statusCode);
        expect(error.getErrorCode()).toBe(errorData.errorCode);
        expect(error.name).toBe('CustomError');
        expect(error.stack).toBeDefined();
    });

    it('should create a DBError instance with default values', () => {
        const error = new DBError({ message: 'DB failure' });
        expect(error.message).toBe('DB failure');
        expect(error.getStatusCode()).toBe(HttpCode.INTERNAL_SERVER_ERROR);
        expect(error.getErrorCode()).toBe(ErrorCode.CANT_STORE_DATA);
        expect(error.name).toBe('DBError');
        expect(error.stack).toBeDefined();
    });

    it('should create a NotFoundError instance with correct defaults', () => {
        const error = new NotFoundError({ message: 'Not found' });
        expect(error.message).toBe('Not found');
        expect(error.getStatusCode()).toBe(HttpCode.NOT_FOUND);
        expect(error.getErrorCode()).toBe(ErrorCode.CANT_STORE_DATA);
        expect(error.name).toBe('NotFoundError');
    });

    it('should create a ValidationError instance correctly', () => {
        const error = new ValidationError(errorData);
        expect(error.message).toBe(errorData.message);
        expect(error.getStatusCode()).toBe(HttpCode.BAD_REQUEST);
        expect(error.getErrorCode()).toBe(errorData.errorCode);
        expect(error.name).toBe('ValidationError');
    });

    it('should identify BaseError instances using isBaseError', () => {
        const baseError = new BaseError(errorData);
        const customError = new CustomError(errorData);
        const dbError = new DBError({ message: 'DB issue' });

        expect(isBaseError(baseError)).toBe(true);
        expect(isBaseError(customError)).toBe(true);
        expect(isBaseError(dbError)).toBe(true);
        expect(isBaseError(new Error('Regular error'))).toBe(false);
        expect(isBaseError(null)).toBe(false);
    });
});
