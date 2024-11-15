import { IUserRoleDataAccess } from 'interfaces/IUserRoleDataAccess';
import { IDatabaseConnection, ITransaction } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IUserRole } from 'interfaces/IUserRole';
import { DBError } from 'src/utils/errors/DBError';

export default class UserRoleDataAccess extends LoggerBase implements IUserRoleDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    public async getUserRole(userId: number): Promise<IUserRole> {
        try {
            this._logger.info(`getUserRole request for userId: ${userId}`);
            const data = await this._db.engine()('userroles').where({ userId }).select(['userRoleId', 'roleId', 'userId']);

            if (!data[0]) {
                throw new Error(`User role not found for userId: ${userId}`);
            }

            this._logger.info(`getUserRole response for userId: ${userId}`);
            return data[0];
        } catch (e) {
            this._logger.error(`Error fetching user role for userId: ${userId} - ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error fetching user role for userId: ${userId} - ${(e as { message: string }).message}`,
            });
        }
    }

    public async updateUserRole(userId: number, newRoleId: number): Promise<IUserRole> {
        try {
            this._logger.info(`updateUserRole request for userId: ${userId} with new roleId: ${newRoleId}`);
            const data = await this._db
                .engine()('userroles')
                .where({ userId })
                .update({ userId, roleId: newRoleId }, ['userRoleId', 'roleId', 'userId']);

            if (!data[0]) {
                throw new Error(`Failed to update role for userId: ${userId}`);
            }

            this._logger.info(`updateUserRole response for userId: ${userId}`);
            return data[0];
        } catch (e) {
            this._logger.error(`Error updating user role for userId: ${userId} - ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error updating user role for userId: ${userId} - ${(e as { message: string }).message}`,
            });
        }
    }

    public async createUserRole(userId: number, roleId: number, trx?: ITransaction): Promise<IUserRole> {
        try {
            this._logger.info(`createUserRole request for userId: ${userId}, roleId: ${roleId}`);
            const query = trx || this._db.engine();
            const data = await query('userroles').insert({ userId, roleId }, ['userRoleId', 'roleId', 'userId']);

            if (!data[0]) {
                throw new Error(`Failed to create user role for userId: ${userId}`);
            }

            this._logger.info(`createUserRole response for userId: ${userId}`);
            return data[0];
        } catch (e) {
            this._logger.error(`Error creating user role for userId: ${userId} - ${(e as { message: string }).message}`);
            throw new DBError({
                message: `Error creating user role for userId: ${userId} - ${(e as { message: string }).message}`,
            });
        }
    }
}
