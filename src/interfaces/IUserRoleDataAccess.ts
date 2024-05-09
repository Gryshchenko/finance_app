import { RoleType } from 'types/RoleType';
import { IUserRole } from 'interfaces/IUserRole';

export interface IUserRoleDataAccess {
    getUserRole(userId: number): Promise<IUserRole>;
    setUserRole(userId: number, newRoleId: number): Promise<IUserRole>;
}
