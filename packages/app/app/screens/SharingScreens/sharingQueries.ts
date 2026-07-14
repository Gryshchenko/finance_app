import { IConnectedMember, IPendingConnectionRequest, IShareGroup, Utils } from '@tenpercent/shared';

import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { ShareGroupService } from '@/services/ShareGroupService';
import { SharingService } from '@/services/SharingService';
import { ValidationError } from '@/utils/errors/ValidationError';
import { Logger } from '@/utils/logger/Logger';

export async function fetchConnections(): Promise<IConnectedMember[] | undefined> {
    try {
        const response = await SharingService.instance().doGetConnections();
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as IConnectedMember[];
            }
            default: {
                return undefined;
            }
        }
    } catch (e) {
        Logger.Of('FetchConnections').error(`Fetch connections failed due reason: ${(e as { message: string }).message}`);
        return undefined;
    }
}

export async function fetchPendingRequests(): Promise<IPendingConnectionRequest[] | undefined> {
    try {
        const response = await SharingService.instance().doGetPendingRequests();
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as IPendingConnectionRequest[];
            }
            default: {
                return undefined;
            }
        }
    } catch (e) {
        Logger.Of('FetchPendingRequests').error(
            `Fetch pending requests failed due reason: ${(e as { message: string }).message}`,
        );
        return undefined;
    }
}

export async function fetchSharingGroups(): Promise<IShareGroup[] | undefined> {
    try {
        const response = await ShareGroupService.instance().doGetGroups();
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as IShareGroup[];
            }
            default: {
                return undefined;
            }
        }
    } catch (e) {
        Logger.Of('FetchSharingGroups').error(`Fetch groups failed due reason: ${(e as { message: string }).message}`);
        return undefined;
    }
}

export async function fetchSharingGroup(userGroupId: number): Promise<IShareGroup | undefined> {
    try {
        if (Utils.isNull(userGroupId)) {
            throw new ValidationError({ message: 'userGroupId = null' });
        }
        const response = await ShareGroupService.instance().doGetGroup(userGroupId);
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as IShareGroup;
            }
            default: {
                return undefined;
            }
        }
    } catch (e) {
        Logger.Of('FetchSharingGroup').error(
            `Fetch group ${userGroupId} failed due reason: ${(e as { message: string }).message}`,
        );
        return undefined;
    }
}
