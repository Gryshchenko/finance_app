import Utils from '../../utils/Utils';

export default class Parameter {
    private readonly _key: string;

    private readonly _value: unknown;

    private constructor(key: string, value: unknown, isWrap: boolean) {
        this._key = isWrap ? Parameter.wrap(key) : key;
        this._value = value;
    }

    public static Of(key: string, value: unknown, isWrap = true): Parameter {
        return new Parameter(key, value, isWrap);
    }

    private static wrap(key: string): string {
        return `{${key}}`;
    }

    public static parameter(key: string, parameters: Parameter[]): Parameter | null {
        if (Utils.isArrayNotEmpty(parameters)) {
            const k: string = Parameter.wrap(key);
            for (const parameter of parameters) {
                if (parameter.key === k) {
                    return parameter;
                }
            }
        }
        return null;
    }

    public static value<V>(key: string, parameters: Parameter[]): V | null {
        const parameter = Parameter.parameter(key, parameters);
        // Use a type assertion here if you are sure that the value will always match type V
        return parameter ? (parameter.value as V) : null;
    }

    public get key(): string {
        return this._key;
    }

    public get value(): unknown {
        return this._value;
    }
}
