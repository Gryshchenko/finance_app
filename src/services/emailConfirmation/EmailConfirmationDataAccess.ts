import { IEmailConfirmationDataAccess } from 'interfaces/IEmailConfirmationDataAccess';
import { IDatabaseConnection, ITransaction } from 'interfaces/IDatabaseConnection';
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
        this._logger.info(`Attempting to delete confirmation with code ${code} for userId ${userId}`);

        try {
            const result = await this._db
                .engine()<IEmailConfirmationData>('email_confirmations')
                .where({ userId, confirmationCode: code })
                .delete();

            const isDeleted = Utils.greaterThen0(result);
            this._logger.info(
                isDeleted
                    ? `Successfully deleted confirmation with code ${code} for userId ${userId}`
                    : `No confirmation found with code ${code} for userId ${userId}`
            );

            return isDeleted;
        } catch (error: any) {
            this._logger.error(`Error deleting confirmation for userId ${userId}: ${error.message}`);
            throw error;
        }
    }

    public async getUserConfirmationWithEmail(userId: number, email: string): Promise<IEmailConfirmationData | undefined> {
        this._logger.info(`Fetching confirmation for userId ${userId} with email ${email}`);

        try {
            const data = await this._db
                .engine()<IEmailConfirmationData>('email_confirmations')
                .where({ userId, email })
                .select('*')
                .first();

            if (data) {
                this._logger.info(`Successfully fetched confirmation for userId ${userId} with email ${email}`);
            } else {
                this._logger.warn(`No confirmation found for userId ${userId} with email ${email}`);
            }

            return data as IEmailConfirmationData;
        } catch (error: any) {
            this._logger.error(`Error fetching confirmation for userId ${userId} with email ${email}: ${error.message}`);
            throw error;
        }
    }

    public async getUserConfirmationWithCode(userId: number, code: number): Promise<IEmailConfirmationData | undefined> {
        this._logger.info(`Fetching confirmation for userId ${userId} with confirmation code ${code}`);

        try {
            const data = await this._db
                .engine()<IEmailConfirmationData>('email_confirmations')
                .where({ userId, confirmationCode: code })
                .select('*')
                .first();

            if (data) {
                this._logger.info(`Successfully fetched confirmation for userId ${userId} with code ${code}`);
            } else {
                this._logger.warn(`No confirmation found for userId ${userId} with code ${code}`);
            }

            return data as IEmailConfirmationData;
        } catch (error: any) {
            this._logger.error(`Error fetching confirmation for userId ${userId} with code ${code}: ${error.message}`);
            throw error;
        }
    }

    public async createUserConfirmation(
        payload: {
            userId: number;
            confirmationCode: number;
            email: string;
            expiresAt: Date;
        },
        trx?: ITransaction,
    ): Promise<IEmailConfirmationData> {
        const { userId, confirmationCode, email, expiresAt } = payload;
        this._logger.info(`Creating confirmation for userId ${userId} with email ${email} and code ${confirmationCode}`);

        try {
            const query = trx || this._db.engine();
            const data = await query<IEmailConfirmationData>('email_confirmations').insert(
                { email, userId, confirmationCode, expiresAt },
                ['*']
            );

            this._logger.info(`Successfully created confirmation for userId ${userId} with email ${email}`);
            return data[0];
        } catch (error: any) {
            this._logger.error(`Error creating confirmation for userId ${userId} with email ${email}: ${error.message}`);
            throw error;
        }
    }


}
