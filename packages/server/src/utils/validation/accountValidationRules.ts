import { ErrorCode, VALID_COLOR_IDS, VALID_ICON_IDS } from '@tenpercent/shared';

import { createCurrencyCodeExistsRule } from 'src/utils/validation/currencyCodeExistsRule';
import { createSignupValidationRules } from 'src/utils/validation/routesInputValidation';

const accountConvertValidationMessageToErrorCode = (path: string): ErrorCode => {
    switch (path) {
        case 'status': {
            return ErrorCode.ACCOUNT_ERROR;
        }
        case 'currencyCode': {
            return ErrorCode.CURRENCY_ERROR;
        }
        case 'accountName': {
            return ErrorCode.ACCOUNT_ERROR;
        }
        case 'amount': {
            return ErrorCode.TRANSACTION_ERROR;
        }
        default: {
            return ErrorCode.ACCOUNT_ERROR;
        }
    }
};
const createAccountValidationRules = [
    ...createSignupValidationRules('accountName', 'string', {
        min: 3,
        max: 128,
    }),
    ...createSignupValidationRules('amount', 'number', {
        min: Number.MIN_SAFE_INTEGER,
        max: Number.MAX_SAFE_INTEGER,
    }),
    ...createSignupValidationRules('currencyCode', 'string', {
        min: 1,
        max: 10,
    }),
    ...createSignupValidationRules('iconId', 'string', {
        allowedValues: VALID_ICON_IDS,
    }),
    ...createSignupValidationRules('colorId', 'string', {
        optional: true,
        allowedValues: VALID_COLOR_IDS,
    }),
    createCurrencyCodeExistsRule(),
];

const patchAccountValidationRules = [
    ...createSignupValidationRules('accountName', 'string', {
        optional: true,
        min: 3,
        max: 128,
    }),
    ...createSignupValidationRules('amount', 'number', {
        optional: true,
        min: Number.MIN_SAFE_INTEGER,
        max: Number.MAX_SAFE_INTEGER,
    }),
    ...createSignupValidationRules('status', 'number', {
        optional: true,
        min: 2,
        max: 3,
    }),
    ...createSignupValidationRules('iconId', 'string', {
        optional: true,
        allowedValues: VALID_ICON_IDS,
    }),
    ...createSignupValidationRules('colorId', 'string', {
        optional: true,
        allowedValues: VALID_COLOR_IDS,
    }),
    ...createSignupValidationRules('position', 'number', {
        optional: true,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
    }),
];

export { patchAccountValidationRules, accountConvertValidationMessageToErrorCode, createAccountValidationRules };
