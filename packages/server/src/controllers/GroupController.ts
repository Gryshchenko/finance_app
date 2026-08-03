import { ErrorCode, HttpCode, ResponseStatusType } from '@tenpercent/shared';
import { Request, Response } from 'express';

import Logger from 'helper/logger/Logger';
import ResponseBuilder from 'helper/responseBuilder/ResponseBuilder';
import GroupServiceBuilder from 'services/group/GroupServiceBuilder';
import { GroupOrchestrationServiceBuilder } from 'services/groupOrchestrator/GroupOrchestrationServiceBuilder';
import { BaseError } from 'src/utils/errors/BaseError';
import { generateErrorResponse } from 'src/utils/generateErrorResponse';

export class GroupController {
    private static readonly logger = Logger.Of('GroupController');

    public static async gets(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const groups = await GroupServiceBuilder.build().getGroups(req.user?.userId as number);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(groups).build());
        } catch (e: unknown) {
            GroupController.logger.error(`Get groups failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.GROUP_ERROR);
        }
    }

    public static async getShareableItems(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const items = await GroupOrchestrationServiceBuilder.build().getShareableItems(req.user?.userId as number);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(items).build());
        } catch (e: unknown) {
            GroupController.logger.error(`Get shareable items failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.GROUP_ERROR);
        }
    }

    public static async get(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userGroupId = Number(req.params?.userGroupId);
            const group = await GroupOrchestrationServiceBuilder.build().getGroup(req.user?.userId as number, userGroupId);
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(group).build());
        } catch (e: unknown) {
            GroupController.logger.error(`Get group failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.GROUP_ERROR);
        }
    }

    public static async post(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const { groupName, description, groupSharedItems } = req.body;
            const group = await GroupOrchestrationServiceBuilder.build().createGroup(req.user?.userId as number, {
                groupName,
                description,
                groupSharedItems,
            });
            res.status(HttpCode.OK).json(responseBuilder.setStatus(ResponseStatusType.OK).setData(group).build());
        } catch (e: unknown) {
            GroupController.logger.error(`Create group failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.GROUP_ERROR);
        }
    }

    public static async patch(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userGroupId = Number(req.params?.userGroupId);
            const { groupName, description, groupSharedItems } = req.body;
            await GroupOrchestrationServiceBuilder.build().patchGroup(req.user?.userId as number, userGroupId, {
                groupName,
                description,
                groupSharedItems,
            });
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            GroupController.logger.error(`Patch group failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.GROUP_ERROR);
        }
    }

    public static async delete(req: Request, res: Response) {
        const responseBuilder = new ResponseBuilder();
        try {
            const userGroupId = Number(req.params?.userGroupId);
            await GroupOrchestrationServiceBuilder.build().deleteGroup(req.user?.userId as number, userGroupId);
            res.status(HttpCode.NO_CONTENT).json(responseBuilder.setStatus(ResponseStatusType.OK).setData({}).build());
        } catch (e: unknown) {
            GroupController.logger.error(`Delete group failed due reason: ${(e as { message: string }).message}`);
            generateErrorResponse(res, responseBuilder, e as BaseError, ErrorCode.GROUP_ERROR);
        }
    }
}
