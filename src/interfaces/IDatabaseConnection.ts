import { Knex } from 'knex';

export interface IDatabaseConnection {
    engine(): Knex;
    close(): Promise<void>;
}
