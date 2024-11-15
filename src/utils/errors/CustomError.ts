import { IError } from 'interfaces/IError';
import { BaseError } from './BaseError';

export class CustomError extends BaseError {
    constructor({ message, statusCode, errorCode }: IError) {
        super({ message, statusCode, errorCode });
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
