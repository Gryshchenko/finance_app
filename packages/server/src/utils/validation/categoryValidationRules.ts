import { ErrorCode, VALID_COLOR_IDS, VALID_ICON_IDS } from 'tenpercent/shared';

import { createCurrencyCodeExistsRule } from 'src/utils/validation/currencyCodeExistsRule';
import { createSignupValidationRules } from 'src/utils/validation/routesInputValidation';

const categoryConvertValidationMessageToErrorCode = (path: string): ErrorCode => {
    switch (path) {
        case 'budget': {
            return ErrorCode.CATEGORY_ERROR;
        }
        case 'status': {
            return ErrorCode.INCOME_ERROR;
        }
        case 'currencyCode': {
            return ErrorCode.CURRENCY_ERROR;
        }
        case 'categoryName': {
            return ErrorCode.CATEGORY_ERROR;
        }
        default: {
            return ErrorCode.CATEGORY_ERROR;
        }
    }
};
const createCategoryValidationRules = [
    ...createSignupValidationRules('categoryName', 'string', {
        min: 3,
        max: 128,
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
    ...createSignupValidationRules('budget', 'number', {
        optional: true,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
    }),
    createCurrencyCodeExistsRule(),
];

const patchCategoryValidationRules = [
    ...createSignupValidationRules('categoryName', 'string', {
        optional: true,
        min: 3,
        max: 128,
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
    ...createSignupValidationRules('budget', 'number', {
        optional: true,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
    }),
    ...createSignupValidationRules('position', 'number', {
        optional: true,
        min: 0,
        max: Number.MAX_SAFE_INTEGER,
    }),
];

export { patchCategoryValidationRules, categoryConvertValidationMessageToErrorCode, createCategoryValidationRules };
