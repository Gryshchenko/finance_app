import { RoleType } from 'types/RoleType';

export interface IUserRole {
    userRoleId: number;
    userId: number;
    roleId: RoleType;
}
