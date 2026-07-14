import { ErrorCode, HttpCode, ResponseStatusType, Utils } from '@tenpercent/shared';
import { Request, Response } from 'express';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import ConnectionServiceBuilder from 'services/connection/ConnectionServiceBuilder';
import { SharingOrchestrationServiceBuilder } from 'services/sharingOrchestrator/SharingOrchestrationServiceBuilder';
import { BaseError } from 'src/utils/errors/BaseError';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';

export class SharingController {
    private static readonly logger = Logger.Of('SharingController');

    public static async getConnections(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const members = await ConnectionServiceBuilder.build().getConnectedMembers(req.user?.userId as number);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(members).build());
        } catch (e: unknown) {
            SharingController.logger.error(`Get connections failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.CONNECTION_ERROR);
        }
    }

    public static async getPendingRequests(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const requests = await ConnectionServiceBuilder.build().getPendingRequests(req.user?.userId as number);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(requests).build());
        } catch (e: unknown) {
            SharingController.logger.error(`Get pending requests failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.CONNECTION_ERROR);
        }
    }

    public static async invite(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const { email, userGroupId } = req.body;
            await SharingOrchestrationServiceBuilder.build().inviteUser(req.user?.userId as number, email, Number(userGroupId));
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            SharingController.logger.error(`Invite user failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.CONNECTION_ERROR);
        }
    }

    public static async accept(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const connectionId = Number(req.params?.connectionId);
            const userGroupId = Utils.isNull(req.body?.userGroupId) ? undefined : Number(req.body.userGroupId);
            await SharingOrchestrationServiceBuilder.build().acceptRequest(req.user?.userId as number, connectionId, userGroupId);
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            SharingController.logger.error(`Accept request failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.CONNECTION_ERROR);
        }
    }

    public static async decline(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const connectionId = Number(req.params?.connectionId);
            await SharingOrchestrationServiceBuilder.build().declineRequest(req.user?.userId as number, connectionId);
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            SharingController.logger.error(`Decline request failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.CONNECTION_ERROR);
        }
    }

    public static async patchMember(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const connectionId = Number(req.params?.connectionId);
            const userGroupId = Number(req.body?.userGroupId);
            await SharingOrchestrationServiceBuilder.build().patchMemberGroup(
                req.user?.userId as number,
                connectionId,
                userGroupId,
            );
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            SharingController.logger.error(`Patch member failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.CONNECTION_ERROR);
        }
    }

    public static async deleteMember(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const connectionId = Number(req.params?.connectionId);
            await SharingOrchestrationServiceBuilder.build().removeMember(req.user?.userId as number, connectionId);
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            SharingController.logger.error(`Delete member failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.CONNECTION_ERROR);
        }
    }
}
