import { ErrorCode, HttpCode, ResponseStatusType } from '@tenpercent/shared';
import { Request, Response } from 'express';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import ConnectionMemberServiceBuilder from 'services/connection/ConnectionMemberServiceBuilder';
import ConnectionOwnerServiceBuilder from 'services/connection/ConnectionOwnerServiceBuilder';
import ConnectionServiceBuilder from 'services/connection/ConnectionServiceBuilder';
import { SharingOrchestrationServiceBuilder } from 'services/sharingOrchestrator/SharingOrchestrationServiceBuilder';
import { BaseError } from 'src/utils/errors/BaseError';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';

export class SharingController {
    private static readonly logger = Logger.Of('SharingController');

    public static async getConnection(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const connectionId = Number(req.params?.connectionId);
            const members = await SharingOrchestrationServiceBuilder.build().getConnection(
                req.user?.userId as number,
                connectionId as number,
            );
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(members).build());
        } catch (e: unknown) {
            SharingController.logger.error(`Get connection failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.CONNECTION_ERROR);
        }
    }

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
            const requests = await ConnectionMemberServiceBuilder.build().getPendingRequests(req.user?.userId as number);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(requests).build());
        } catch (e: unknown) {
            SharingController.logger.error(`Get pending requests failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.CONNECTION_ERROR);
        }
    }

    public static async getSentRequests(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const requests = await ConnectionOwnerServiceBuilder.build().getSentRequests(req.user?.userId as number);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(requests).build());
        } catch (e: unknown) {
            SharingController.logger.error(`Get sent requests failed due reason: ${(e as { message: string }).message}`);
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
            await SharingOrchestrationServiceBuilder.build().acceptRequest(req.user?.userId as number, connectionId);
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

    public static async patchOwner(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const connectionId = Number(req.params?.connectionId);
            const userGroupId = Number(req.body?.userGroupId);
            await SharingOrchestrationServiceBuilder.build().patchOwnerGroup(
                req.user?.userId as number,
                connectionId,
                userGroupId,
            );
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            SharingController.logger.error(`Patch owner failed due reason: ${(e as { message: string }).message}`);
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

    public static async leave(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const connectionId = Number(req.params?.connectionId);
            await SharingOrchestrationServiceBuilder.build().leaveConnection(req.user?.userId as number, connectionId);
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            SharingController.logger.error(`Leave connection failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.CONNECTION_ERROR);
        }
    }
}
