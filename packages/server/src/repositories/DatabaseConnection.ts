import knex, { Knex } from 'knex';

import { IDatabaseConnection, IDBTransaction } from 'interfaces/IDatabaseConnection';

interface IDatabaseConnectionConstructor {
    host: string | undefined;
    port: number | undefined;
    database: string | undefined;
    user: string | undefined;
    password: string | undefined;
    ssl: boolean | undefined;
    // cert: string | undefined;
}

export default class DatabaseConnection implements IDatabaseConnection {
    private readonly _db: Knex;

    private static _inspect: IDatabaseConnection;

    public static instance(config: IDatabaseConnectionConstructor): IDatabaseConnection {
        return DatabaseConnection._inspect || (DatabaseConnection._inspect = new DatabaseConnection(config));
    }

    public constructor({ host, port, database, user, password, ssl }: IDatabaseConnectionConstructor) {
        this._db = knex({
            client: 'pg',
            connection: {
                host,
                port,
                database,
                user,
                password,
                // Certificate is always verified when TLS is on; to trust a custom/self-signed
                // CA in dev, point NODE_EXTRA_CA_CERTS at its root cert instead of disabling checks.
                ssl: ssl ? { rejectUnauthorized: true } : false,
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
