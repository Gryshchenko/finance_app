type ValidationResult = {
    valid: boolean;
    error?: string;
};

export class FluentValidator<T = any> {
    private value: T;
    private errors: string[] = [];
    private requiredFlag = false;

    constructor(value: T) {
        this.value = value;
    }

    public static start<T>(value: T) {
        return new FluentValidator(value);
    }

    public required(): this {
        this.requiredFlag = true;
        if (this.value === null || this.value === undefined || this.value === '') {
            this.errors.push('Value is required');
        }
        return this;
    }

    public number(options?: { min?: number; max?: number; integer?: boolean }): this {
        if (this.value === null || this.value === undefined) return this;
        if (typeof this.value !== 'number') this.errors.push('Value must be a number');
        else {
            if (options?.integer && !Number.isInteger(this.value)) this.errors.push('Value must be an integer');
            if (options?.min !== undefined && this.value < options.min) this.errors.push(`Value must be >= ${options.min}`);
            if (options?.max !== undefined && this.value > options.max) this.errors.push(`Value must be <= ${options.max}`);
        }
        return this;
    }

    public string(options?: { minLength?: number; maxLength?: number; trim?: boolean }): this {
        if (this.value === null || this.value === undefined) return this;
        if (typeof this.value !== 'string') this.errors.push('Value must be a string');
        else {
            let str = this.value;
            if (options?.trim) str = str.trim() as T & string;
            if (options?.minLength !== undefined && str.length < options.minLength)
                this.errors.push(`String must be at least ${options.minLength} characters`);
            if (options?.maxLength !== undefined && str.length > options.maxLength)
                this.errors.push(`String must be at most ${options.maxLength} characters`);
        }
        return this;
    }

    public email(): this {
        if (this.value === null || this.value === undefined) return this;
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof this.value !== 'string' || !regex.test(this.value)) this.errors.push('Invalid email format');
        return this;
    }

    public url(): this {
        if (this.value === null || this.value === undefined) return this;
        try {
            new URL(this.value as string);
        } catch {
            this.errors.push('Invalid URL');
        }
        return this;
    }

    public array(options?: { minLength?: number; maxLength?: number; elementValidator?: (el: any) => ValidationResult }): this {
        if (!Array.isArray(this.value)) {
            this.errors.push('Value must be an array');
            return this;
        }
        if (options?.minLength !== undefined && this.value.length < options.minLength)
            this.errors.push(`Array must have at least ${options.minLength} items`);
        if (options?.maxLength !== undefined && this.value.length > options.maxLength)
            this.errors.push(`Array must have at most ${options.maxLength} items`);
        if (options?.elementValidator) {
            for (const el of this.value) {
                const res = options.elementValidator(el);
                if (!res.valid) {
                    this.errors.push(res.error || 'Invalid element in array');
                    break;
                }
            }
        }
        return this;
    }

    public enum(allowedValues: any[]): this {
        if (!allowedValues.includes(this.value)) this.errors.push(`Value must be one of: ${allowedValues.join(', ')}`);
        return this;
    }

    public regex(pattern: RegExp, message?: string): this {
        if (typeof this.value !== 'string' || !pattern.test(this.value)) this.errors.push(message || 'Invalid format');
        return this;
    }

    public date(): this {
        const date = new Date(this.value as string | number);
        if (isNaN(date.getTime())) this.errors.push('Invalid date');
        return this;
    }

    public boolean(): this {
        if (typeof this.value !== 'boolean') this.errors.push('Value must be a boolean');
        return this;
    }

    public validate(): ValidationResult {
        return { valid: this.errors.length === 0, error: this.errors[0] };
    }
}
