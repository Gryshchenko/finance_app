import { Utils, ErrorCode } from 'tenpercent/shared';

import { BaseError } from '@/utils/errors/BaseError';
import { ValidationError } from '@/utils/errors/ValidationError';

export class ErrorUtils {
    public static validateObjectFields<T extends Record<string, unknown>>(
        obj: T,
        context: string,
        buildError?: (err: ValidationError) => BaseError,
        errorCode: ErrorCode = ErrorCode.CLIENT_UNKNOWN_ERROR,
    ): BaseError | void {
        for (const key of Object.keys(obj)) {
            if (Utils.isNull(obj[key])) {
                const error = new ValidationError({
                    errorCode,
                    message: `${context} failed, key: '${key}' should be empty`,
                });
                return buildError ? buildError(error) : error;
            }
        }
        return undefined;
    }
}
