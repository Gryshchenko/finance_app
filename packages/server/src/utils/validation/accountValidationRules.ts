import { ErrorCode } from 'tenpercent/shared';

import { createSignupValidationRules } from 'src/utils/validation/routesInputValidation';

const accountConvertValidationMessageToErrorCode = (path: string): ErrorCode => {
    switch (path) {
        case 'status': {
            return ErrorCode.ACCOUNT_ERROR;
        }
        case 'currencyId': {
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
    ...createSignupValidationRules('currencyId', 'number', {
        min: Number.MIN_SAFE_INTEGER,
        max: Number.MAX_SAFE_INTEGER,
    }),
    ...createSignupValidationRules('iconId', 'string', {
        min: 3,
        max: 128,
    }),
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
        min: 3,
        max: 128,
    }),
];

export { patchAccountValidationRules, accountConvertValidationMessageToErrorCode, createAccountValidationRules };
