import { ResponseStatusType } from 'types/ResponseStatusType';
import ResponseBuilder, { IResponse } from './ResponseBuilder';
import { ErrorCode } from 'types/ErrorCode';

export class ResponseBuilderPreset {
    public static getSuccess(): IResponse {
        return new ResponseBuilder().setStatus(ResponseStatusType.INTERNAL).setData({}).build();
    }

    public static getAuthError(): IResponse {
        return new ResponseBuilder().setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: ErrorCode.AUTH }).build();
    }
}
