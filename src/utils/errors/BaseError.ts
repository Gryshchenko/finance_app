import { IError } from 'interfaces/IError';
import { ErrorCode } from 'types/ErrorCode';
import { HttpCode } from 'types/HttpCode';

export class BaseError extends Error {
    private readonly statusCode: HttpCode;
    private readonly errorCode: ErrorCode;

    constructor({ message, statusCode = HttpCode.INTERNAL_SERVER_ERROR, errorCode = ErrorCode.CANT_STORE_DATA }: IError) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }

    public getStatusCode = () => {
        return this.statusCode;
    };

    public getErrorCode(): ErrorCode {
        return this.errorCode;
    }
}
