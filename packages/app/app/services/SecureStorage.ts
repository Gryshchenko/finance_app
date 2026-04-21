import * as SecureStore from 'expo-secure-store';

import { Logger } from '@/utils/logger/Logger';

export type SecureKey = string;

export interface ISecureStorage {
    save(key: SecureKey, value: string): Promise<void>;
    get(key: SecureKey): Promise<string | null>;
    remove(key: SecureKey): Promise<void>;
}

export class SecureStorage implements ISecureStorage {
    protected _logger: Logger = Logger.Of('SecureStorage');

    async save(key: SecureKey, value: string): Promise<void> {
        try {
            await SecureStore.setItemAsync(key, value);
        } catch (e) {
            this._logger.error(`Failed to save key ${key}:`, e);
            throw e;
        }
    }

    async get(key: SecureKey): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(key);
        } catch (e) {
            this._logger.error(`Failed to get key ${key}:`, e);
            return null;
        }
    }

    async remove(key: SecureKey): Promise<void> {
        try {
            await SecureStore.deleteItemAsync(key);
        } catch (e) {
            this._logger.error(`Failed to delete key ${key}:`, e);
        }
    }
}
