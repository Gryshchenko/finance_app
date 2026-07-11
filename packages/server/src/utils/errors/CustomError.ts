import { IError } from '@tenpercent/shared';

import { BaseError } from './BaseError';

export class CustomError extends BaseError {
    constructor({ message, statusCode, errorCode, payload }: IError) {
        super({ message, statusCode, errorCode, payload });
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
