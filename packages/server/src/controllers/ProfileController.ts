import { Request, Response } from 'express';
import { extractToken, ResponseStatusType, ErrorCode, HttpCode, Utils } from 'tenpercent/shared';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { IUser } from 'interfaces/IUser';
import AuthServiceBuilder from 'services/auth/AuthServiceBuilder';
import ProfileServiceBuilder from 'services/profile/ProfileServiceBuilder';
import ProfileServiceUtils from 'services/profile/ProfileServiceUtils';
import { BaseError } from 'src/utils/errors/BaseError';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';

export class ProfileController {
    private static readonly logger = Logger.Of('ProfileController');
    public static async get(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userFromSession = req.user as IUser;
            const profileService = ProfileServiceBuilder.build();
            const response = await profileService.get(userFromSession.userId);
            if (!response) {
                throw new ValidationError({
                    errorCode: ErrorCode.PROFILE_ERROR,
                    statusCode: HttpCode.INTERNAL_SERVER_ERROR,
                    message: 'Fetch profile failed due reason: profile not found',
                });
            }
            res.status(HttpCode.OK).json(
                responseBuilder
                    .setStatus(ResponseStatusType.OK)
                    .setData(ProfileServiceUtils.convertServerUserToClientUser(response))
                    .build(),
            );
        } catch (e: unknown) {
            ProfileController.logger.error(`Fetch profile failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.PROFILE_ERROR);
        }
    }

    public static async patch(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userFromSession = req.user as IUser;
            const { locale, currencyId, publicName } = req.body;
            if (Utils.isEmpty(locale) && Utils.isEmpty(currencyId) && Utils.isEmpty(publicName)) {
                throw new ValidationError({ message: 'Patch profile failed due reason: empty body' });
            }
            await ProfileServiceBuilder.build().patch(userFromSession.userId, { locale, currencyId, publicName });
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            ProfileController.logger.error(`Patch profile failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.PROFILE_ERROR);
        }
    }

    public static async requestEmailChange(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userFromSession = req.user as IUser;
            const { newEmail } = req.body;
            const result = await ProfileServiceBuilder.build().requestEmailChange(userFromSession.userId, newEmail);
            res.status(HttpCode.OK).json(
                responseBuilder.setStatus(ResponseStatusType.OK).setData({ expiresAt: result.expiresAt, id: result.id }).build(),
            );
        } catch (e: unknown) {
            ProfileController.logger.error(`Request email change failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.PROFILE_ERROR);
        }
    }

    public static async refreshConfirmationCodeForEmailChange(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userFromSession = req.user as IUser;
            const { newEmail } = req.body;
            await ProfileServiceBuilder.build().refreshConfirmationCodeForEmailChange(userFromSession.userId, newEmail);
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            ProfileController.logger.error(
                `Refresh confirmation code for email change failed due reason: ${(e as { message: string }).message}`,
            );
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.PROFILE_ERROR);
        }
    }

    public static async confirmEmailChange(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userFromSession = req.user as IUser;
            const { confirmationCode, newEmail } = req.body;
            await ProfileServiceBuilder.build().confirmEmailChange(userFromSession.userId, newEmail, Number(confirmationCode));
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            ProfileController.logger.error(`Confirm email change failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.PROFILE_ERROR);
        }
    }

    public static async requestPasswordChange(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userFromSession = req.user as IUser;
            const { newPassword, password } = req.body;
            const result = await ProfileServiceBuilder.build().requestPasswordChange(
                userFromSession.userId,
                newPassword,
                password,
            );
            res.status(HttpCode.OK).json(
                responseBuilder.setStatus(ResponseStatusType.OK).setData({ expiresAt: result.expiresAt }).build(),
            );
        } catch (e: unknown) {
            ProfileController.logger.error(`Request password change failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.PROFILE_ERROR);
        }
    }

    public static async confirmPasswordChange(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const token = extractToken(req.headers.authorization);
            const userFromSession = req.user as IUser;
            const { confirmationCode } = req.body;
            await ProfileServiceBuilder.build().confirmPasswordChange(userFromSession.userId, Number(confirmationCode));
            await AuthServiceBuilder.build().logout(token as string);
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            ProfileController.logger.error(`Confirm password change failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.PROFILE_ERROR);
        }
    }
    public static async refreshConfirmationCodeForPasswordChange(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userFromSession = req.user as IUser;
            const { confirmationId } = req.body;
            await ProfileServiceBuilder.build().refreshConfirmationCodeForPasswordChange(
                userFromSession.userId,
                Number(confirmationId),
            );
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            ProfileController.logger.error(
                `Refresh confirmation code for password change failed due reason: ${(e as { message: string }).message}`,
            );
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.PROFILE_ERROR);
        }
    }
}
