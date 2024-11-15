import { IError } from 'interfaces/IError';
import { ErrorCode } from 'types/ErrorCode';
import { HttpCode } from 'types/HttpCode';
import { BaseError } from './BaseError';

export class DBError extends BaseError {
    constructor({ message, statusCode = HttpCode.INTERNAL_SERVER_ERROR, errorCode = ErrorCode.CANT_STORE_DATA }: IError) {
        super({ message, statusCode, errorCode });
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
