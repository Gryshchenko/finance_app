export default class Utils {
    public static isNumber(value: string): boolean {
        return /^\d+$/.test(value);
    }

    public static parseNumber(v: string): number | null {
        if (Utils.isNotEmpty(v)) {
            const result: number = parseFloat(v);
            if (isNaN(result)) {
                return null;
            }
            return result;
        }
        return null;
    }

    public static escapeRegExp(v: string): string {
        if (Utils.isNotEmpty(v)) {
            return v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
        return v;
    }

    public static parseBoolean(v: string): boolean | null {
        if (v === 'true') {
            return true;
        } else if (v === 'false') {
            return false;
        }
        return null;
    }

    public static parse(v: string): unknown {
        let result: unknown = Utils.parseNumber(v);
        if (Utils.isNotNull(result)) {
            return result;
        }
        result = Utils.parseBoolean(v);
        if (Utils.isNotNull(result)) {
            return result;
        }
        return v;
    }

    public static nullToEmpty(val: string): string {
        return this.isNotEmpty(val) ? val : '';
    }

    public static isNotEmpty(val: string): boolean {
        return typeof val !== 'undefined' && val !== null && val.length > 0;
    }

    public static isNotNull(value: unknown): boolean {
        return value !== null && value !== 'undefined';
    }

    public static isNull(val: unknown): boolean {
        return typeof val === 'undefined' || val === null;
    }

    public static isArrayNotEmpty(val: unknown[]): boolean {
        return typeof val !== 'undefined' && val !== null && Array.isArray(val) && val.length > 0;
    }

    public static isArrayEmpty(val: unknown[]): boolean {
        return typeof val === 'undefined' || val === null || (Array.isArray(val) && val.length === 0);
    }

    public static isObjectEmpty(val: Record<string | number | symbol, unknown>): boolean {
        return Utils.isNull(val) || (Object.keys(val).length === 0 && (val as object).constructor === Object);
    }

    public static greaterThen0(val: number): boolean {
        return this.isNotNull(val) && val > 0;
    }

    public static not0(val: number): boolean {
        return this.isNotNull(val) && val !== 0;
    }

    public static lessThen0(val: number): boolean {
        return this.isNotNull(val) && val < 0;
    }

    public static compareUndefined(o1: unknown, o2: unknown): number {
        if (this.isNotNull(o1) && this.isNull(o2)) {
            return -1;
        }
        if (this.isNull(o1) && this.isNotNull(o2)) {
            return 1;
        }
        return 0;
    }

    public static compareArrayLength<T>(o1: T[], o2: T[]): number {
        const result: number = Utils.compareUndefined(o1, o2);
        if (result === 0 && Utils.isNotNull(o1) && Utils.isNotNull(o2)) {
            if (o1.length < o2.length) return -1;
            if (o1.length > o2.length) return 1;
            return 0;
        }
        return result;
    }

    public static compareObject(a: Record<string, unknown>, b: Record<string, unknown>) {
        for (const key in a) {
            if (!(key in b) || a[key] !== b[key]) {
                return false;
            }
        }
        for (const key in b) {
            if (!(key in a) || a[key] !== b[key]) {
                return false;
            }
        }
        return true;
    }

    public static compareArrays<T>(arr1: T[], arr2: T[], comparator: (t1: T, t2: T) => number): number {
        Utils.checkNotNull(comparator);
        let result: number = this.compareArrayLength(arr1, arr2);
        if (result === 0 && Utils.isNotNull(arr1) && Utils.isNotNull(arr2)) {
            for (let i = 0; i < arr1.length; i++) {
                result = comparator(arr1[i], arr2[i]);
                if (result !== 0) {
                    break;
                }
            }
        }
        return result;
    }

    public static has(array: unknown[], val: unknown): boolean {
        if (Utils.isArrayNotEmpty(array) && Utils.isNotNull(val)) {
            for (const value of array) {
                if (value === val) {
                    return true;
                }
            }
        }
        return false;
    }

    public static isEmpty(val: string | undefined): val is string {
        return typeof val === 'undefined' || val === null || val.length === 0;
    }

    public static checkNotNull<T>(reference: T, msg?: string): T {
        if (Utils.isNull(reference)) {
            throw new ReferenceError(msg);
        }
        return reference;
    }

    public static pad(v: number): string {
        return `0${v.toString()}`.slice(-2);
    }

    public static replaceAll(value: string, regex: string, replacement: string): string {
        if (Utils.isNotNull(value)) {
            return value.replace(new RegExp(Utils.escapeRegExp(regex), 'g'), replacement);
        }
        return value;
    }

    public static to<T, U = unknown>(promise: Promise<T>, errorExt?: Record<string, unknown>): Promise<[U | null, T | unknown]> {
        return promise
            .then<[null, T]>((data: T) => [null, data])
            .catch<[U, unknown]>((err) => {
                if (errorExt) {
                    Object.assign(err, errorExt);
                }
                return [err, undefined];
            });
    }
}
