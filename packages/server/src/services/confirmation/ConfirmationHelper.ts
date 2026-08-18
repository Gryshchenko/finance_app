import { ErrorCode, HttpCode } from '@tenpercent/shared';
import { randomBytes } from 'crypto';

import { ValidationError } from 'src/utils/errors/ValidationError';
import TimeManagerUTC from 'src/utils/TimeManagerUTC';

export class ConfirmationHelper {
    /** Smallest and largest value `generateCode` can return - every code is exactly 8 digits. */
    private static readonly CODE_MIN = 10_000_000;

    private static readonly CODE_RANGE = 90_000_000;

    /**
     * Uniformly random 8-digit confirmation code.
     *
     * Taking `randomBytes(4)` modulo the range would bias the low end, because 2^32 is not a
     * multiple of 90 000 000: the first 4 230 000 000 values map evenly onto the range and the
     * 64 967 296 above that would land a second time on the first ~65M codes. Drawing again
     * whenever the sample falls in that tail removes the bias; the tail is ~1.5% of draws, so
     * the loop practically always runs once.
     */
    static generateCode(): number {
        const limit = Math.floor(0x1_0000_0000 / ConfirmationHelper.CODE_RANGE) * ConfirmationHelper.CODE_RANGE;
        for (;;) {
            const sample = randomBytes(4).readUInt32BE(0);
            if (sample < limit) {
                return ConfirmationHelper.CODE_MIN + (sample % ConfirmationHelper.CODE_RANGE);
            }
        }
    }

    static createExpiresAt(expiresIn: [number, number, number]): Date {
        const timeManager = new TimeManagerUTC();
        timeManager.addTime(...expiresIn);
        return timeManager.getCurrentTime();
    }

    // Converts an [hours, minutes, seconds] expiry tuple into whole minutes (for user-facing copy).
    static toMinutes([hours, minutes, seconds]: [number, number, number]): number {
        return hours * 60 + minutes + Math.round(seconds / 60);
    }

    static validateCode(stored: number, provided: number): void {
        if (isNaN(provided) || stored !== provided) {
            throw new ValidationError({
                message: 'Invalid confirmation code',
                errorCode: ErrorCode.EMAIL_CONFIRMATION_ERROR,
                statusCode: HttpCode.BAD_REQUEST,
                payload: { field: 'confirmationCode', reason: 'validation:codeInvalided' },
            });
        }
    }

    static assertExists<T>(record: T | undefined, error: ValidationError): asserts record is T {
        if (!record) throw error;
    }
}
