import Utils from '../../utils/Utils';

export default class Parameter {
    private readonly _key: string;
    private readonly _value: any;

    private constructor(key: string, value: any, isWrap: boolean) {
        this._key = isWrap ? Parameter.wrap(key) : key;
        this._value = value;
    }

    public static Of(key: string, value: any, isWrap = true): Parameter {
        return new Parameter(key, value, isWrap);
    }

    private static wrap(key: string): string {
        return '{' + key + '}';
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

    public static value<V>(key: string, parameters: Parameter[]): V {
        const parameter: Parameter | null = Parameter.parameter(key, parameters);
        // @ts-ignore
        return Utils.isNotNull(parameter) && parameter?.value !== null ? parameter.value : null;
    }

    public get key(): string {
        return this._key;
    }

    public get value(): any {
        return this._value;
    }
}
