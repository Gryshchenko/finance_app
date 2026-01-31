import { ErrorCode } from 'tenpercent/shared';

export interface IError {
    message: string;
    errorCode?: ErrorCode;
}
