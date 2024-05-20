import { IEmailConfirmationDataAccess } from 'interfaces/IEmailConfirmationDataAccess';
import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IEmailConfirmationData } from 'interfaces/IEmailConfirmationData';
import Utils from 'src/utils/Utils';

export default class EmailConfirmationDataAccess extends LoggerBase implements IEmailConfirmationDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    public async deleteUserConfirmation(userId: number, code: number): Promise<boolean> {
        try {
            this._logger.info('deleteUserConfirmation request');
            const data = await this._db
                .engine()<IEmailConfirmationData>('email_confirmations')
                .delete()
                .where({ userId, confirmationCode: code });
            this._logger.info('deleteUserConfirmation response');
            return Utils.greaterThen0(data);
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }

    public async getUserConfirmationWithEmail(userId: number, email: string): Promise<IEmailConfirmationData | undefined> {
        try {
            this._logger.info('getUserConfirmationWithEmail request');
            const data = await this._db
                .engine()<IEmailConfirmationData>('email_confirmations')
                .where({ userId, email })
                .select('*')
                .first();
            this._logger.info('getUserConfirmationWithEmail response');
            return data as IEmailConfirmationData;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }

    public async getUserConfirmationWithCode(userId: number, code: number): Promise<IEmailConfirmationData | undefined> {
        try {
            this._logger.info('getUserConfirmation request');
            const data = await this._db
                .engine()<IEmailConfirmationData>('email_confirmations')
                .where({ userId, confirmationCode: code })
                .select('*')
                .first();
            this._logger.info('getUserConfirmation response');
            return data as IEmailConfirmationData;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }

    public async createUserConfirmation(payload: {
        userId: number;
        confirmationCode: number;
        email: string;
        expiresAt: Date;
    }): Promise<IEmailConfirmationData> {
        try {
            const { userId, confirmationCode, email, expiresAt } = payload;
            this._logger.info('createUserConfirmation request');
            const data = await this._db.engine()<IEmailConfirmationData>('email_confirmations').insert(
                {
                    email,
                    userId,
                    confirmationCode,
                    expiresAt,
                },
                ['*'],
            );
            this._logger.info('createUserConfirmation response');
            return data[0];
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }
}
