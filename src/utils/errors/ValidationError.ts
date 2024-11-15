import { IError } from 'interfaces/IError';
import { HttpCode } from 'types/HttpCode';
import { BaseError } from './BaseError';

export class ValidationError extends BaseError {
    constructor({ message, statusCode = HttpCode.BAD_REQUEST, errorCode }: IError) {
        super({ message, statusCode, errorCode });
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
