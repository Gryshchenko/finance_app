import { RoleType } from 'types/RoleType';
import { IUserRole } from 'interfaces/IUserRole';

export interface IUserRoleDataAccess {
    getUserRole(userId: number): Promise<IUserRole | undefined>;
    updateUserRole(userId: number, newRoleId: number): Promise<IUserRole | undefined>;
    createUserRole(userId: number, newRoleId: number): Promise<IUserRole>;
}
