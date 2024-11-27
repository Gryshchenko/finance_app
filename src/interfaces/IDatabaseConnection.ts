import { Knex } from 'knex';

export type IDBTransaction = Knex.Transaction;

export interface IDatabaseConnection {
    engine(): Knex;
    close(): Promise<void>;
    transaction(): Promise<IDBTransaction>;
}
