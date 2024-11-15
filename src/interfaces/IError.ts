import { ErrorCode } from 'types/ErrorCode';
import { HttpCode } from 'types/HttpCode';

export interface IError {
    message: string;
    errorCode?: ErrorCode;
    statusCode?: HttpCode;
}
