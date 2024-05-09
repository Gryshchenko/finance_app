import { IEmailConfirmationDataAccess } from 'interfaces/IEmailConfirmationDataAccess';
import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';
import { IEmailConfirmationData } from 'interfaces/IEmailConfirmationData';

export default class EmailConfirmationDataAccess extends LoggerBase implements IEmailConfirmationDataAccess {
    private readonly _db: IDatabaseConnection;

    public constructor(db: IDatabaseConnection) {
        super();
        this._db = db;
    }

    public async confirmUserMail(payload: {
        userId: number;
        email: string;
        confirmationId: number;
    }): Promise<IEmailConfirmationData> {
        try {
            this._logger.info('confirmUserMail request');
            const { userId, email, confirmationId } = payload;
            const data = await this._db
                .engine()<IEmailConfirmationData>('email_confirmations')
                .where({ userId, email, confirmationId })
                .update({ confirmed: true }, ['*'])
                .first();
            this._logger.info('confirmUserMail response');
            return data as IEmailConfirmationData;
        } catch (error) {
            this._logger.error(error);
            throw error;
        }
    }

    public async getUserConfirmation(userId: number, email: string): Promise<IEmailConfirmationData> {
        try {
            this._logger.info('getUserConfirmation request');
            const data = await this._db
                .engine()<IEmailConfirmationData>('email_confirmations')
                .where({ userId, email })
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

    public async updateUserConfirmation(payload: {
        userId: number;
        confirmationCode: number;
        email: string;
        expiresAt: Date;
        confirmationId: number;
    }): Promise<IEmailConfirmationData> {
        try {
            this._logger.info('createUserConfirmation request');
            const { userId, confirmationCode, email, expiresAt, confirmationId } = payload;
            const data = await this._db
                .engine()<IEmailConfirmationData>('email_confirmations')
                .where({
                    userId,
                    email,
                    confirmationId,
                })
                .update(
                    {
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
