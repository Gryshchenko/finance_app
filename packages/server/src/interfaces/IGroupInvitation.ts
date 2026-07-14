import { InvitationStatus } from 'types/InvitationStatus';

export interface IGroupInvitation {
    invitationId: number;
    userGroupId: number;
    invitedEmail: string;
    status: InvitationStatus;
}
