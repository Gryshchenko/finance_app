import { ValidationError } from 'src/utils/errors/ValidationError';

function validateAllowedProperties<T extends Record<string, unknown>>(obj: T, allowedKeys: string[]): void {
    const invalidKeys = Object.keys(obj).filter((key) => !allowedKeys.includes(key));

    if (invalidKeys.length > 0) {
        throw new ValidationError({
            message: `Invalid properties detected: ${invalidKeys.join(', ')}`,
        });
    }
}

export { validateAllowedProperties };
