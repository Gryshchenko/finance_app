import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { Knex } from 'knex';

const knex = require('knex');

export default class DatabaseConnection implements IDatabaseConnection {
    private readonly _db: Knex;

    public constructor({
        host,
        port,
        database,
        user,
        password,
        cert,
    }: {
        host: string | undefined;
        port: number | undefined;
        database: string | undefined;
        user: string | undefined;
        password: string | undefined;
        cert: string | undefined;
    }) {
        this._db = knex({
            client: 'pg',
            connection: {
                host,
                port,
                database,
                user,
                password,
                ssl: {
                    ca: cert,
                },
            },
        });
    }

    public engine(): Knex {
        try {
            return this._db;
        } catch (error) {
            throw new Error(`Error executing query: ${error}`);
        }
    }

    public async close(): Promise<void> {
        await this._db.destroy();
    }
    public async transaction(): Promise<IDBTransaction> {
        return await this._db.transaction();
    }
}
