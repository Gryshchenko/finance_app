import { Request, Response } from 'express';
import { ResponseStatusType, ErrorCode, HttpCode } from 'tenpercent/shared';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import { IUser } from 'interfaces/IUser';
import UserServiceBuilder from 'services/user/UserServiceBuilder';
import { BaseError } from 'src/utils/errors/BaseError';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';

export class UserController {
    private static readonly logger = Logger.Of('UserController');
    public static async get(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userFromSession = req.user as IUser;
            const response = await UserServiceBuilder.build().get(userFromSession.userId);
            res.status(HttpCode.OK).json(
                responseBuilder
                    .setStatus(ResponseStatusType.OK)
                    .setData({ userId: response.userId, status: response.status, email: response.email })
                    .build(),
            );
        } catch (e: unknown) {
            UserController.logger.error(`Fetch user failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.USER_ERROR);
        }
    }
}
