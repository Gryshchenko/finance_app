import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { readFileSync } from 'fs';
import { Knex } from 'knex';

const caCert = readFileSync('./eu-central-1-bundle.pem').toString();

const knex = require('knex');

module.exports = class DatabaseConnection implements IDatabaseConnection {
    private _db: Knex;

    public constructor({
        host,
        port,
        database,
        user,
        password,
    }: {
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
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
                    ca: caCert,
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
};
