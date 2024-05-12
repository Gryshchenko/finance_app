import { IUserRoleDataAccess } from 'interfaces/IUserRoleDataAccess';
import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IUserRole } from 'interfaces/IUserRole';

export default class UserRoleDataService extends LoggerBase implements IUserRoleDataAccess {
    private readonly _db: IDatabaseConnection;
    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }
    public async getUserRole(userId: number): Promise<IUserRole> {
        try {
            this._logger.info('getUserRole request');
            const data = await this._db.engine()('userroles').where({ userId }).select(['userRoleId', 'roleId', 'userId']);
            this._logger.info('getUserRole response');
            return data[0];
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
    public async updateUserRole(userId: number, newRoleId: number): Promise<IUserRole> {
        try {
            this._logger.info('updateUserRole request');
            const data = await this._db.engine()('userroles').where({ userId }).update(
                {
                    userId,
                    roleId: newRoleId,
                },
                ['userRoleId', 'roleId', 'userId'],
            );
            this._logger.info('updateUserRole response');
            return data[0];
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
    public async createUserRole(userId: number, roleId: number): Promise<IUserRole> {
        try {
            this._logger.info('createUserRole request');
            const data = await this._db.engine()('userroles').insert(
                {
                    userId,
                    roleId,
                },
                ['userRoleId', 'roleId', 'userId'],
            );
            this._logger.info('createUserRole response');
            return data[0];
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
}
