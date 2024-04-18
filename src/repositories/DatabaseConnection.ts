import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { Knex } from 'knex';

const knex = require('knex');

export default class DatabaseConnection implements IDatabaseConnection {
    private _db: Knex;

    public constructor({
        host,
        port,
        database,
        user,
        password,
        cert,
    }: {
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
        cert: string;
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
}
