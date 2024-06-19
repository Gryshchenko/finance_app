import { Request, Response } from 'express';
import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { IUserSession } from 'interfaces/IUserSession';
import ProfileServiceBuilder from 'services/profile/ProfileServiceBuilder';
import { ResponseStatusType } from 'types/ResponseStatusType';
import ProfileServiceUtils from 'services/profile/ProfileServiceUtils';
import { ErrorCode } from 'types/ErrorCode';
import UserRegistrationServiceBuilder from 'services/registration/UserRegistrationServiceBuilder';
import Success from 'src/utils/success/Success';
import Failure from 'src/utils/failure/Failure';

export class ProfileController {
    private static logger = Logger.Of('ProfileController');
    public static async profile(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userFromSession = req.session.user as IUserSession;
            if (parseInt(req.params.userId) !== userFromSession.userId) {
                throw new Error('Profile id not match');
            }
            const profileService = ProfileServiceBuilder.build();
            const response = await profileService.getProfile(userFromSession.userId);
            res.status(200).json(
                responseBuilder
                    .setStatus(ResponseStatusType.OK)
                    .setData(ProfileServiceUtils.convertServerUserToClientUser(response))
                    .build(),
            );
        } catch (error) {
            ProfileController.logger.error(error);
            res.status(400).json(
                responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: ErrorCode.PROFILE_ERROR }).build(),
            );
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
            if (response instanceof Success) {
                res.status(200).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(response.value).build());
            } else {
                ProfileController.logger.error((response as Failure).error);
                return res.status(400).json(
                    responseBuilder
                        .setStatus(ResponseStatusType.INTERNAL)
                        .setError({ errorCode: (response as Failure).code })
                        .build(),
                );
            }
        } catch (error) {
            ProfileController.logger.error(error);
            res.status(400).json(
                responseBuilder.setStatus(ResponseStatusType.INTERNAL).setError({ errorCode: ErrorCode.CANT_STORE_DATA }).build(),
            );
        }
    }
}
