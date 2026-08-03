import {
    IConnectedMember,
    IGroupSharedItem,
    IPendingConnectionRequest,
    ISentConnectionRequest,
    IShareGroup,
    Utils,
} from '@tenpercent/shared';

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

export async function fetchConnection(connectionId: number): Promise<IConnectedMember | undefined> {
    try {
        const response = await SharingService.instance().doGetConnection(connectionId);
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as IConnectedMember;
            }
            default: {
                return undefined;
            }
        }
    } catch (e) {
        Logger.Of('FetchConnection').error(
            `Fetch connection ${connectionId} failed due reason: ${(e as { message: string }).message}`,
        );
        return undefined;
    }
}
export async function fetchSentRequests(): Promise<ISentConnectionRequest[] | undefined> {
    try {
        const response = await SharingService.instance().doGetSentRequests();
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as ISentConnectionRequest[];
            }
            default: {
                return undefined;
            }
        }
    } catch (e) {
        Logger.Of('FetchSentRequests').error(`Fetch sent requests failed due reason: ${(e as { message: string }).message}`);
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

export async function fetchShareableItems(): Promise<IGroupSharedItem[] | undefined> {
    try {
        const response = await ShareGroupService.instance().doGetShareableItems();
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as IGroupSharedItem[];
            }
            default: {
                return undefined;
            }
        }
    } catch (e) {
        Logger.Of('FetchShareableItems').error(`Fetch shareable items failed due reason: ${(e as { message: string }).message}`);
        return undefined;
    }
}
