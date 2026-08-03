import { ErrorCode, Utils } from '@tenpercent/shared';

import { ValidationError } from 'src/utils/errors/ValidationError';

export function validateConnectionId(value: number, name: string): void {
    if (Utils.isNull(value) || !Number.isInteger(value) || value <= 0) {
        throw new ValidationError({
            message: `${name} must be a positive integer`,
            errorCode: ErrorCode.CONNECTION_ERROR,
        });
    }
}
