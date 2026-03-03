import { createMMKV, MMKV } from 'react-native-mmkv';

type Primitive = string | number | boolean | null;
type Storable = Primitive | Record<string, any>;

interface SetOptions {
    ttl?: number; // ms
}

interface StoredValue<T> {
    value: T;
    expiresAt?: number;
}

export class MMKVStorage {
    private storage: MMKV;
    private prefix: string;

    constructor(prefix = 'app') {
        this.prefix = prefix;
        this.storage = createMMKV({ id: prefix });
    }

    private key(key: string) {
        return `${this.prefix}:${key}`;
    }

    set<T extends Storable>(key: string, value: T, options?: SetOptions): void {
        const payload: StoredValue<T> = {
            value,
            expiresAt: options?.ttl ? Date.now() + options.ttl : undefined,
        };

        this.storage.set(this.key(key), JSON.stringify(payload));
    }

    get<T extends Storable>(key: string): T | null {
        const raw = this.storage.getString(this.key(key));
        if (!raw) return null;

        try {
            const parsed: StoredValue<T> = JSON.parse(raw);

            if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
                this.remove(key);
                return null;
            }

            return parsed.value;
        } catch {
            return null;
        }
    }

    remove(key: string): void {
        this.storage.remove(this.key(key));
    }

    has(key: string): boolean {
        return this.storage.contains(this.key(key));
    }

    clear(): void {
        this.storage.clearAll();
    }
}
