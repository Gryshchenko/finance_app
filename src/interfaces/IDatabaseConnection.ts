import { Knex } from 'knex';

export type ITransaction = Knex.Transaction;

export interface IDatabaseConnection {
    engine(): Knex;
    close(): Promise<void>;
    transaction(): Promise<ITransaction>;
}
