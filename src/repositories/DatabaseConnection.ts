import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';
import { Knex } from 'knex';

const knex = require('knex');

interface IDatabaseConnectionConstructor {
    host: string | undefined;
    port: number | undefined;
    database: string | undefined;
    user: string | undefined;
    password: string | undefined;
    cert: string | undefined;
}

export default class DatabaseConnection implements IDatabaseConnection {
    private readonly _db: Knex;

    private static _inspect: IDatabaseConnection;

    public static instance(config: IDatabaseConnectionConstructor): IDatabaseConnection {
        return DatabaseConnection._inspect || (DatabaseConnection._inspect = new DatabaseConnection(config));
    }

    public constructor({ host, port, database, user, password, cert }: IDatabaseConnectionConstructor) {
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
                pool: {
                    min: 1,
                    max: 100,
                },
            },
            pool: {
                min: 0,
                max: 100,
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
