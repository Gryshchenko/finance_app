import { Request, Response } from 'express';
import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import UserRegistrationServiceBuilder from 'services/registration/UserRegistrationServiceBuilder';
import { LanguageType, ResponseStatusType } from 'tenpercent/shared';
import { ErrorCode } from 'tenpercent/shared';
import { HttpCode } from 'tenpercent/shared';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';
import { BaseError } from 'src/utils/errors/BaseError';
import { UserStatus } from 'tenpercent/shared';
import { IUser } from 'interfaces/IUser';

export class RegisterController {
    private static readonly logger = Logger.Of('RegisterController');
    public static async signup(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();

        try {
            const response = await UserRegistrationServiceBuilder.build().createUser(
                String(req.body.email.toLocaleLowerCase()),
                String(req.body.password),
                String(req.body.locale) as LanguageType,
                String(req.body.publicName),
                String(req.body.currencyCode),
            );
            const { user, token, longToken } = response;
            res.setHeader('Authorization', `Bearer ${token}`);
            res.status(HttpCode.OK).json(
                responseBuilder
                    .setStatus(ResponseStatusType.OK)
                    .setData({
                        userId: user.userId,
                        email: user.email,
                        status: UserStatus.NO_VERIFIED,
                        tokenLong: longToken,
                        token,
                    })
                    .build(),
            );
        } catch (e: unknown) {
            RegisterController.logger.error(`Signup failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.SIGNUP_CATCH_ERROR);
        }
    }
    public static async signUpConfirmMail(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userFromSession = req.user as IUser;
            await UserRegistrationServiceBuilder.build().confirmUserMail(
                userFromSession.userId,
                userFromSession.email,
                Number(req.body.confirmationCode),
            );
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).build());
        } catch (e: unknown) {
            RegisterController.logger.error(`Signup confirm mail failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.EMAIL_VERIFICATION_FAILED_ERROR);
        }
    }
}
