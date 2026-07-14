import { ErrorCode } from '@tenpercent/shared';

import { createSignupValidationRules } from 'src/utils/validation/routesInputValidation';

const groupConvertValidationMessageToErrorCode = (path: string): ErrorCode => {
    switch (path) {
        case 'groupName': {
            return ErrorCode.GROUP_ERROR;
        }
        case 'description': {
            return ErrorCode.GROUP_ERROR;
        }
        default: {
            return ErrorCode.GROUP_ERROR;
        }
    }
};

const createGroupValidationRules = [
    ...createSignupValidationRules('groupName', 'string', {
        min: 1,
        max: 128,
        escapeHTML: true,
    }),
    ...createSignupValidationRules('description', 'string', {
        optional: true,
        max: 256,
        escapeHTML: true,
    }),
];

const patchGroupValidationRules = [
    ...createSignupValidationRules('groupName', 'string', {
        optional: true,
        min: 1,
        max: 128,
        escapeHTML: true,
    }),
    ...createSignupValidationRules('description', 'string', {
        optional: true,
        max: 256,
        escapeHTML: true,
    }),
];

export { createGroupValidationRules, patchGroupValidationRules, groupConvertValidationMessageToErrorCode };
