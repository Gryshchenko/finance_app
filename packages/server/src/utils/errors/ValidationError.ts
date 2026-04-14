import { IError, HttpCode } from 'tenpercent/shared';

import { BaseError } from './BaseError';

export class ValidationError extends BaseError {
    constructor({ message, statusCode = HttpCode.BAD_REQUEST, errorCode, payload }: IError) {
        super({ message, statusCode, errorCode, payload });
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
