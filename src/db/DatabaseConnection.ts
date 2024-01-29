import { IDatabaseConnection } from 'interfaces/IDatabaseConnection';
import { readFileSync } from 'fs';
import { Pool as IPool, PoolClient, QueryResult } from 'pg';
const { Pool } = require('pg');

const caCert = readFileSync('./eu-central-1-bundle.pem').toString();

module.exports = class DatabaseConnection implements IDatabaseConnection {
    private _db: IPool;

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
        this._db = new Pool({
            host,
            port,
            database,
            user,
            password,
            ssl: {
                rejectUnauthorized: false,
                ca: caCert,
            },
        });
    }

    public async query<T>(sql: string, args: Array<unknown>): Promise<T> {
        const client = await this._db.connect();
        const data = await client.query(sql, args);
        client.release();
        return data.rows[0];
    }

    public async close(): Promise<void> {
        return this._db.end();
    }
};
