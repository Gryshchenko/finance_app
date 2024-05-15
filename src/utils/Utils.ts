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
        return v === 'true' ? true : v === 'false' ? false : null;
    }

    public static parse(v: string): any {
        let result: any = Utils.parseNumber(v);
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

    public static isNotNull(val: any): boolean {
        return typeof val !== 'undefined' && val !== null;
    }

    public static isNull(val: any): boolean {
        return typeof val === 'undefined' || val === null;
    }

    public static isArrayNotEmpty(val: any[]): boolean {
        return typeof val !== 'undefined' && val !== null && Array.isArray(val) && val.length > 0;
    }

    public static isArrayEmpty(val: any[]): boolean {
        return typeof val === 'undefined' || val === null || (Array.isArray(val) && val.length === 0);
    }

    public static isObjectEmpty(val: any): boolean {
        return Utils.isNull(val) || (Object.keys(val).length === 0 && val.constructor === Object);
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

    public static compareUndefined(o1: any, o2: any): number {
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
            return o1.length < o2.length ? -1 : o1.length > o2.length ? 1 : 0;
        }
        return result;
    }

    public static compareObject(a: { [key: string]: any }, b: { [key: string]: any }) {
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

    public static compareNumber(o1: number, o2: number): number {
        const result: number = this.compareUndefined(o1, o2);
        if (result === 0 && this.isNotNull(o1) && this.isNotNull(o2)) {
            return o1 === o2 ? 0 : o1 < o2 ? -1 : 1;
        }
        return result;
    }

    public static compareString(o1: string, o2: string): number {
        const result: number = Utils.compareUndefined(o1, o2);
        if (result === 0 && Utils.isNotNull(o1) && Utils.isNotNull(o2)) {
            return o1 < o2 ? -1 : o1 > o2 ? 1 : 0;
        }
        return result;
    }

    public static has(array: any[], val: any): boolean {
        if (Utils.isArrayNotEmpty(array) && Utils.isNotNull(val)) {
            for (let i = 0; i < array.length; i++) {
                if (array[i] === val) {
                    return true;
                }
            }
        }
        return false;
    }

    public static isEmpty(val: string): boolean {
        return typeof val === 'undefined' || val === null || val.length === 0;
    }

    public static checkNotNull<T>(reference: T, msg?: string): T {
        if (Utils.isNull(reference)) {
            throw new ReferenceError(msg);
        }
        return reference;
    }

    public static randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    public static pad(v: number): string {
        return `0${v.toString()}`.slice(-2);
    }

    public static remove<T>(arr: T[], item: T): boolean {
        if (Utils.isArrayNotEmpty(arr) && item) {
            for (let i = 0; i < arr.length; i++) {
                if (arr[i] === item) {
                    arr.splice(i, 1);
                    return true;
                }
            }
        }
        return false;
    }

    public static replaceAll(value: string, regex: string, replacement: string): string {
        if (Utils.isNotNull(value)) {
            return value.replace(new RegExp(Utils.escapeRegExp(regex), 'g'), replacement);
        }
        return value;
    }

    public static to<T, U = any>(promise: Promise<T>, errorExt?: Record<string, any>): Promise<[U | null, T | undefined]> {
        return promise
            .then<[null, T]>((data: T) => [null, data])
            .catch<[U, undefined]>((err) => {
                if (errorExt) {
                    Object.assign(err, errorExt);
                }
                return [err, undefined];
            });
    }

    public static isObject(item: any): boolean {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    public static merge(target: any, ...sources: any[]): any {
        if (!sources.length) {
            return target;
        }
        const source = sources.shift();
        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                if (this.isObject(source[key])) {
                    if (!target[key]) {
                        Object.assign(target, { [key]: {} });
                    }
                    this.merge(target[key], source[key]);
                } else if (Array.isArray(source[key])) {
                    Object.assign(target, { [key]: source[key] });
                } else if (typeof source[key] !== 'undefined') {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }
        return this.merge(target, ...sources);
    }

    public static deepCopy<T>(source: Record<string, any>): T {
        return JSON.parse(JSON.stringify(source));
    }

    public static capitalizeFirstLetter = (string: string): string => {
        return string?.charAt(0).toUpperCase() + string?.slice(1).toLowerCase();
    };
}
