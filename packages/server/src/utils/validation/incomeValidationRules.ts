import { ErrorCode, VALID_ICON_IDS } from 'tenpercent/shared';

import { createSignupValidationRules } from 'src/utils/validation/routesInputValidation';

const incomeConvertValidationMessageToErrorCode = (path: string): ErrorCode => {
    switch (path) {
        case 'iconId':
            return ErrorCode.INCOME_ERROR;
        case 'status': {
            return ErrorCode.INCOME_ERROR;
        }
        case 'currencyId': {
            return ErrorCode.CURRENCY_ERROR;
        }
        case 'incomeName': {
            return ErrorCode.INCOME_ERROR;
        }
        default: {
            return ErrorCode.INCOME_ERROR;
        }
    }
};
const createIncomeValidationRules = [
    ...createSignupValidationRules('incomeName', 'string', {
        min: 3,
        max: 128,
    }),
    ...createSignupValidationRules('iconId', 'string', {
        allowedValues: VALID_ICON_IDS,
    }),
    ...createSignupValidationRules('currencyId', 'number', {
        min: Number.MIN_SAFE_INTEGER,
        max: Number.MAX_SAFE_INTEGER,
    }),
];

const patchIncomeValidationRules = [
    ...createSignupValidationRules('incomeName', 'string', {
        optional: true,
        min: 3,
        max: 128,
    }),
    ...createSignupValidationRules('iconId', 'string', {
        optional: true,
        allowedValues: VALID_ICON_IDS,
    }),
    ...createSignupValidationRules('status', 'number', {
        optional: true,
        min: 2,
        max: 3,
    }),
    ...createSignupValidationRules('position', 'number', {
        optional: true,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
    }),
];

export { patchIncomeValidationRules, incomeConvertValidationMessageToErrorCode, createIncomeValidationRules };
