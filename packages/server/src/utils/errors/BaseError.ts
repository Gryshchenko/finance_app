import { IError, HttpCode, ErrorCode } from 'tenpercent/shared';

export class BaseError extends Error {
    private readonly statusCode: HttpCode;
    private readonly errorCode: ErrorCode;
    private readonly payload: Record<string, unknown> | undefined;

    constructor({
        message,
        statusCode = HttpCode.INTERNAL_SERVER_ERROR,
        errorCode = ErrorCode.CANT_STORE_DATA,
        payload,
    }: IError) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.payload = payload;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }

    public getStatusCode = () => {
        return this.statusCode;
    };

    public getErrorCode(): ErrorCode {
        return this.errorCode;
    }
    public getPayload(): Record<string, unknown> | undefined {
        return this.payload;
    }
}
