import { IUserRole } from 'interfaces/IUserRole';

export interface IUserRoleService {
    getUserRole(userId: number): Promise<IUserRole | undefined>;
    updateUserRole(userId: number, newRoleId: number): Promise<IUserRole | undefined>;
    createUserRole(userId: number, newRoleId: number): Promise<IUserRole>;
}
