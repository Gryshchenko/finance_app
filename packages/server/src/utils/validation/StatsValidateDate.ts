import { DateFormat, Time } from 'tenpercent/shared';

import { ValidationError } from 'src/utils/errors/ValidationError';

export const statsValidateDate = (date: string): string => {
    let day: string | null = null;
    try {
        day = Time.formatDate(date, DateFormat.YYYY_MM_DD);
    } catch (e) {
        throw new ValidationError({
            message: (e as { message: string }).message,
            payload: {
                field: 'createdAt',
            },
        });
    }
    return day;
};
