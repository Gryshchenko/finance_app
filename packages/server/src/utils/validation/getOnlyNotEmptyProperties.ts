export const getOnlyNotEmptyProperties = (
    properties: Record<string, unknown>,
    allowedKeys: string[],
): Record<string, unknown> => {
    const properestForUpdate: Record<string, unknown> = {};
    Object.keys(properties).forEach((key: string) => {
        const value = (properties as Record<string, unknown>)[key];

        if (value !== undefined && allowedKeys.includes(key as string)) {
            properestForUpdate[key] = value;
        }
    });
    return properestForUpdate;
};
