import { randomBytes } from 'crypto';
import { ErrorCode, HttpCode } from 'tenpercent/shared';
import { ValidationError } from 'src/utils/errors/ValidationError';
import TimeManagerUTC from 'src/utils/TimeManagerUTC';

export class ConfirmationHelper {
    static generateCode(): number {
        const buffer = randomBytes(4);
        const number = buffer.readUInt32BE(0);
        return Number(number.toString().padStart(8, '0').substring(0, 8));
    }

    static createExpiresAt(expiresIn: [number, number, number]): Date {
        const timeManager = new TimeManagerUTC();
        timeManager.addTime(...expiresIn);
        return timeManager.getCurrentTime();
    }

    static validateCode(stored: number, provided: number): void {
        if (isNaN(provided) || stored !== provided) {
            throw new ValidationError({
                message: 'Invalid confirmation code',
                errorCode: ErrorCode.EMAIL_CONFIRMATION_ERROR,
                statusCode: HttpCode.BAD_REQUEST,
                payload: { field: 'confirmationCode', reason: 'invalid' },
            });
        }
    }

    static assertExists<T>(record: T | undefined, error: ValidationError): asserts record is T {
        if (!record) throw error;
    }
}
