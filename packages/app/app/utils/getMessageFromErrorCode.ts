import { getErrorCodeKey } from '@tenpercent/shared';

import { TxKeyPath } from '@/i18n/index';
import { hasTranslate } from '@/i18n/translate';

export const getMessageFromErrorCode = (errorCode: number): TxKeyPath => {
    const key = getErrorCodeKey(errorCode) ?? 'CLIENT_UNKNOWN_ERROR';
    const message = `errorCode:${key}` as TxKeyPath;
    if (hasTranslate(message)) {
        return message;
    }
    return 'errorCode:UNKNOWN_ERROR';
};
