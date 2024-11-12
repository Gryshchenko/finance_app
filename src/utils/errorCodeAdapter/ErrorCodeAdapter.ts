import { ErrorCode } from "types/ErrorCode";
import { HttpCode } from "types/HttpCode";

export class ErrorCodeAdapter {
    private static errorToHttpMap: Record<ErrorCode, HttpCode> = {
        [ErrorCode.VALIDATION_ERROR]: HttpCode.BAD_REQUEST,
        [ErrorCode.USER_ALREADY_EXISTS]: HttpCode.CONFLICT,
        [ErrorCode.AUTHENTICATION_FAILED]: HttpCode.UNAUTHORIZED,
        [ErrorCode.INTERNAL_ERROR]: HttpCode.INTERNAL_SERVER_ERROR,
    };

    public static toHttpCode(errorCode: ErrorCode): HttpCode {
        return this.errorToHttpMap[errorCode] || HttpCode.INTERNAL_SERVER_ERROR;
    }
}
