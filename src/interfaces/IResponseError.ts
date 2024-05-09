import { ErrorCode } from 'types/ErrorCode';

export interface IResponseError {
    errorCode: ErrorCode | undefined;
    msg?: string;
}
