import { ErrorCode, Utils } from 'tenpercent/shared';

import { ValidationError } from 'src/utils/errors/ValidationError';

type SortOrder = 'asc' | 'desc';

interface SortField {
    column: string;
    order: SortOrder;
}

function parseSortBy(sortBy: string | undefined, allowedFields: string[]): SortField[] {
    if (Utils.isEmpty(sortBy)) return [];
    const sortByStr = sortBy as unknown as string;
    const sortByArr = sortByStr.split(',');
    if (!sortByArr.length) return [];

    return sortByArr.map((part: string) => {
        const [field, direction = 'asc'] = part.split(':');

        if (!allowedFields.includes(field)) {
            throw new ValidationError({ message: `Invalid sort field: ${field}`, errorCode: ErrorCode.QUERY_DATA_ERROR });
        }

        const order = direction.toLowerCase();
        if (order !== 'asc' && order !== 'desc') {
            throw new ValidationError({
                message: `Invalid sort order: ${direction} for field: ${field}`,
                errorCode: ErrorCode.QUERY_DATA_ERROR,
            });
        }

        return { column: field, order: order as SortOrder };
    });
}

export { parseSortBy };
