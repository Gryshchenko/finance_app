import { Request, Response } from 'express';
import { ResponseStatusType, RoleType, ErrorCode, HttpCode, extractToken } from 'tenpercent/shared';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { IUser } from 'interfaces/IUser';
import AuthServiceBuilder from 'services/auth/AuthServiceBuilder';
import PasswordForgetServiceBuilder from 'services/passwordForget/PasswordForgetServiceBuilder';
import UserServiceUtils from 'services/user/UserServiceUtils';
import { BaseError } from 'src/utils/errors/BaseError';
import { CustomError } from 'src/utils/errors/CustomError';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';

export class AuthController {
    private static readonly logger = Logger.Of('AuthController');

    public static async verify(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const session = req.user as IUser;
            if (!session || !session.userId) {
                throw new ValidationError({
                    message: 'User in JWT session not found',
                    statusCode: HttpCode.UNAUTHORIZED,
                    errorCode: ErrorCode.AUTH_ERROR,
                });
            }
            res.status(HttpCode.OK).json(
                responseBuilder
                    .setStatus(ResponseStatusType.OK)
                    .setData({
                        userId: session.userId,
                        email: session.email,
                        status: session.status,
                    })
                    .build(),
            );
        } catch (e) {
            AuthController.logger.info(`Verify failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.TOKEN_INVALID_ERROR);
        }
    }

    public static async refresh(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const token = String(req.body.token);
            const user = req.user;
            const userId = Number(user?.userId);
            const newToken = await AuthServiceBuilder.build().refresh(token, userId, RoleType.Default);
            res.setHeader('Authorization', `Bearer ${newToken}`);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({ token: newToken }).build());
        } catch (e) {
            AuthController.logger.info(`Verify failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.TOKEN_LONG_INVALID_ERROR);
        }
    }

    public static async logout(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const token = extractToken(req.headers.authorization);
            if (!token) {
                throw new CustomError({
                    message: 'Token not provided',
                    statusCode: HttpCode.UNAUTHORIZED,
                    errorCode: ErrorCode.TOKEN_INVALID_ERROR,
                });
            }

            await AuthServiceBuilder.build().logout(token as string);
            AuthController.logger.info('Logout successful');
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).build());
        } catch (e) {
            AuthController.logger.info(`Logout failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.AUTH_ERROR);
        }
    }

    public static async login(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const { user, token, longToken } = await AuthServiceBuilder.build().login(
                req.body.email.toLocaleLowerCase(),
                req.body.password,
            );
            res.setHeader('Authorization', `Bearer ${token}`);
            res.status(HttpCode.OK).json(
                responseBuilder
                    .setStatus(ResponseStatusType.OK)
                    .setData({ ...UserServiceUtils.convertServerUserToClientUser(user, longToken, token) })
                    .build(),
            );
        } catch (e: unknown) {
            AuthController.logger.error(`Use login failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.AUTH_ERROR);
        }
    }
    public static async forget(req: Request, res: Response) {
        try {
            await PasswordForgetServiceBuilder.build().request(req.body.email.toLowerCase());
        } catch (e: unknown) {
            AuthController.logger.error(`Forget password failed: ${(e as { message: string }).message}`);
        } finally {
            res.status(HttpCode.NO_CONTENT).send();
        }
    }

    public static async forgetRefresh(req: Request, res: Response) {
        try {
            await PasswordForgetServiceBuilder.build().refresh(req.body.email.toLowerCase());
        } catch (e: unknown) {
            AuthController.logger.error(`Forget password refresh failed: ${(e as { message: string }).message}`);
        } finally {
            res.status(HttpCode.NO_CONTENT).send();
        }
    }

    public static async forgetConfirm(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const { resetToken, userId } = await PasswordForgetServiceBuilder.build().confirm(
                req.body.email.toLowerCase(),
                Number(req.body.confirmationCode),
            );
            res.status(HttpCode.OK).json(
                responseBuilder.setStatus(ResponseStatusType.OK).setData({ resetToken, userId }).build(),
            );
        } catch (e: unknown) {
            AuthController.logger.error(`Forget password confirm failed: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.AUTH_ERROR);
        }
    }

    public static async forgetChange(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const user = req.user;
            const userId = Number(user?.userId);
            await PasswordForgetServiceBuilder.build().forgetChange(req.body.newPassword, userId);
            const token = extractToken(req.headers.authorization);
            await AuthServiceBuilder.build().logout(token as string);
            res.status(HttpCode.NO_CONTENT).send();
        } catch (e: unknown) {
            AuthController.logger.error(`Use forget change failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.FORGOT_PASSWORD_ERROR);
        }
    }
}
