import { IUserRole } from 'interfaces/IUserRole';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';

export interface IUserRoleDataAccess {
    getUserRole(userId: number): Promise<IUserRole | undefined>;
    updateUserRole(userId: number, newRoleId: number): Promise<IUserRole | undefined>;
    createUserRole(userId: number, newRoleId: number, trx?: IDBTransaction): Promise<IUserRole | undefined>;
}
