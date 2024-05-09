import { IUserRoleService } from 'interfaces/IUserRoleService';
import { IUserRoleDataAccess } from 'interfaces/IUserRoleDataAccess';
import { IUserRole } from 'interfaces/IUserRole';

export default class UserRoleService implements IUserRoleService {
    private _userRoleDataAccess: IUserRoleDataAccess;
    public constructor(userDataAccess: IUserRoleDataAccess) {
        this._userRoleDataAccess = userDataAccess;
    }

    public async getUserRole(userId: number): Promise<IUserRole> {
        return await this._userRoleDataAccess.getUserRole(userId);
    }

    public async setUserRole(userId: number, newRoleId: number): Promise<IUserRole> {
        return await this._userRoleDataAccess.setUserRole(userId, newRoleId);
    }
}
