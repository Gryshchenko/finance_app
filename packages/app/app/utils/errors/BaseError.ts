import { ErrorCode } from 'tenpercent/shared';

import { IError } from '@/interfaces/IError';

export class BaseError extends Error {
    private readonly errorCode: ErrorCode;

    constructor({ message, errorCode = ErrorCode.CLIENT_UNKNOWN_ERROR }: IError) {
        super(message);
        this.errorCode = errorCode;
        this.name = this.constructor.name;
    }

    public getErrorCode(): ErrorCode {
        return this.errorCode;
    }

    public getMessage(): string {
        return this.message;
    }
    public build(): { errorCode: ErrorCode; message: string } {
        return { errorCode: this.errorCode, message: this.message };
    }
}
