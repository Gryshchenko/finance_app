import { IDatabaseConnection, ITransaction } from 'interfaces/IDatabaseConnection';
import Utils from 'src/utils/Utils';
import { LoggerBase } from 'src/helper/logger/LoggerBase';

export class UnitOfWork extends LoggerBase {
    private trx: ITransaction | null = null;
    private db: IDatabaseConnection;

    constructor(db: IDatabaseConnection) {
        super();
        this.db = db;
    }

    async start() {
        this.trx = await this.db.transaction();
        return this.trx;
    }

    async commit() {
        if (Utils.isNotNull(this.trx)) {
            const trx = this.trx as unknown as ITransaction;
            await trx.commit();
        } else {
            this._logger.info('Transaction module not initialize');
        }
    }

    async rollback() {
        if (Utils.isNotNull(this.trx)) {
            const trx = this.trx as unknown as ITransaction;
            await trx.rollback();
        } else {
            this._logger.info('Transaction module not initialize');
        }
    }

    getTransaction() {
        if (Utils.isNotNull(this.trx)) {
            const trx = this.trx as unknown as ITransaction;
            return trx;
        } else {
            this._logger.info('Transaction module not initialize');
            return null;
        }
    }
}
