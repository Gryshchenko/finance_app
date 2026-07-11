import { RoleType } from '@tenpercent/shared';

export interface IUserRole {
    userRoleId: number;
    userId: number;
    roleId: RoleType;
}
