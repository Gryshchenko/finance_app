import { IUserRole } from 'interfaces/IUserRole';
import { ITransaction } from 'interfaces/IDatabaseConnection';

export interface IUserRoleDataAccess {
    getUserRole(userId: number): Promise<IUserRole | undefined>;
    updateUserRole(userId: number, newRoleId: number): Promise<IUserRole | undefined>;
    createUserRole(userId: number, newRoleId: number, trx?: ITransaction): Promise<IUserRole | undefined>;
}
