import { Request, Response } from 'express';
import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { IUserSession } from 'interfaces/IUserSession';
import ProfileServiceBuilder from 'services/profile/ProfileServiceBuilder';
import { ResponseStatusType } from 'types/ResponseStatusType';
import ProfileServiceUtils from 'services/profile/ProfileServiceUtils';
import { ErrorCode } from 'types/ErrorCode';
import UserRegistrationServiceBuilder from 'services/registration/UserRegistrationServiceBuilder';
import { HttpCode } from 'types/HttpCode';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';
import { ValidationError } from 'src/utils/errors/ValidationError';

export class ProfileController {
    private static logger = Logger.Of('ProfileController');
    public static async profile(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userFromSession = req.session.user as IUserSession;
            if (parseInt(req.params.userId) !== userFromSession.userId) {
                throw new ValidationError({ message: 'Fetch profile failed due reason id not match', errorCode: ErrorCode.AUTH });
            }
            const profileService = ProfileServiceBuilder.build();
            const response = await profileService.getProfile(userFromSession.userId);
            res.status(HttpCode.OK).json(
                responseBuilder
                    .setStatus(ResponseStatusType.OK)
                    .setData(ProfileServiceUtils.convertServerUserToClientUser(response))
                    .build(),
            );
        } catch (e) {
            ProfileController.logger.error(`Fetch profile failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e, ErrorCode.PROFILE_ERROR);
        }
    }

    public static async confirmEmail(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userFromSession = req.session.user as IUserSession;
            const response = await UserRegistrationServiceBuilder.build().confirmUserMail(
                userFromSession.userId,
                Number(req.body.code),
            );
            res.status(200).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(response).build());
        } catch (e) {
            ProfileController.logger.error(`Comfirm mail failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e, ErrorCode.PROFILE_ERROR);
        }
    }
}
