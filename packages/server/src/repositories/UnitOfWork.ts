import { Utils } from '@tenpercent/shared';

import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { LoggerBase } from 'src/helper/logger/LoggerBase';

export class UnitOfWork extends LoggerBase {
    private trx: IDBTransaction | null = null;
    private trxId: string | null = null;
    private readonly db: IDatabaseConnection;

    constructor(db: IDatabaseConnection) {
        super();
        this.db = db;
        this.trxId = Utils.uuid();
    }

    async start() {
        this.trx = await this.db.transaction();
        this._logger.debug(`[TX:${this.trxId}] Starting transaction`);

        return this.trx;
    }

    async commit() {
        if (Utils.isNotNull(this.trx)) {
            const trx = this.trx as unknown as IDBTransaction;
            await trx.commit();
            this._logger.debug(`[TX:${this.trxId}] Transaction committed`);
        } else {
            this._logger.info(`[TX:${this.trxId}] Transaction module not initialize`);
        }
    }

    async rollback() {
        if (Utils.isNotNull(this.trx)) {
            const trx = this.trx as unknown as IDBTransaction;
            await trx.rollback();
        } else {
            this._logger.info(`[TX:${this.trxId}] Transaction module not initialize`);
        }
    }

    getTransaction() {
        if (Utils.isNotNull(this.trx)) {
            const trx = this.trx as unknown as IDBTransaction;
            return trx;
        } else {
            this._logger.info(`[TX:${this.trxId}] Transaction module not initialize`);
            return null;
        }
    }
}
