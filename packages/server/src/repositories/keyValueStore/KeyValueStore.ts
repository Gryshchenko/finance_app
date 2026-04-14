import Redis from 'ioredis';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { getConfig } from 'src/config/config';

export enum KeyValueStoreKeys {
    TokenShort = 'tokenShort',
}

export interface IKeyValueStore {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
    get<T = unknown>(key: string): Promise<T | null>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
}

class KeyValueStore extends LoggerBase implements IKeyValueStore {
    private client: Redis;
    private prefix: string;

    public static instance(config: { url: string; port: number; prefix?: string }): KeyValueStore {
        return KeyValueStore._instance || (KeyValueStore._instance = new KeyValueStore(config));
    }
    private static _instance: KeyValueStore;

    constructor({ url, port, prefix = '' }: { url: string; port: number; prefix?: string }) {
        super();
        this.client = new Redis({
            password: getConfig().redisPassword,
            username: getConfig().redisUsername,
            host: url,
            port,
            lazyConnect: true,
            maxRetriesPerRequest: 5,
            enableReadyCheck: true,
        });
        this.prefix = prefix;
        this.client.on('ready', () => {
            this._logger.info('Redis is ready to use');
        });

        this.client.on('error', (err) => {
            this._logger.error('Redis error', err);
        });

        this.client.on('reconnecting', () => {
            this._logger.info('Redis reconnecting...');
        });
    }

    private key(key: string) {
        return `${this.prefix}${key}`;
    }

    async connect() {
        if (!this.client.status || this.client.status === 'end' || this.client.status === 'close') {
            await this.client.connect();
        }
    }

    async disconnect() {
        await this.client.quit();
    }

    async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
        const stringified = JSON.stringify(value);
        if (ttlSeconds) {
            await this.client.set(this.key(key), stringified, 'EX', ttlSeconds);
        } else {
            await this.client.set(this.key(key), stringified);
        }
    }

    async get<T = unknown>(key: string): Promise<T | null> {
        const result = await this.client.get(this.key(key));
        return result ? (JSON.parse(result) as T) : null;
    }

    async delete(key: string): Promise<void> {
        await this.client.del(this.key(key));
    }

    async exists(key: string): Promise<boolean> {
        const result = await this.client.exists(this.key(key));
        return result === 1;
    }
}

export { KeyValueStore };
