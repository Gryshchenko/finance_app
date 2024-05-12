import { IUserRoleService } from 'interfaces/IUserRoleService';
import { IUserRoleDataAccess } from 'interfaces/IUserRoleDataAccess';
import { IUserRole } from 'interfaces/IUserRole';

export default class UserRoleService implements IUserRoleService {
    private _userRoleDataAccess: IUserRoleDataAccess;
    public constructor(userDataAccess: IUserRoleDataAccess) {
        this._userRoleDataAccess = userDataAccess;
    }

    public async getUserRole(userId: number): Promise<IUserRole | undefined> {
        return await this._userRoleDataAccess.getUserRole(userId);
    }

    public async updateUserRole(userId: number, newRoleId: number): Promise<IUserRole | undefined> {
        return await this._userRoleDataAccess.updateUserRole(userId, newRoleId);
    }
    public async createUserRole(userId: number, roleId: number): Promise<IUserRole> {
        return await this._userRoleDataAccess.createUserRole(userId, roleId);
    }
}
