import { ErrorCode } from '@tenpercent/shared';

import { createSignupValidationRules } from 'src/utils/validation/routesInputValidation';

const sharingConvertValidationMessageToErrorCode = (path: string): ErrorCode => {
    switch (path) {
        case 'email': {
            return ErrorCode.EMAIL_INVALID_ERROR;
        }
        case 'userGroupId': {
            return ErrorCode.GROUP_ERROR;
        }
        default: {
            return ErrorCode.CONNECTION_ERROR;
        }
    }
};

const inviteUserValidationRules = [
    ...createSignupValidationRules('email', 'email', {
        min: 3,
        max: 100,
    }),
    ...createSignupValidationRules('userGroupId', 'number', {
        min: 1,
        max: Number.MAX_SAFE_INTEGER,
    }),
];

const acceptRequestValidationRules = [
    ...createSignupValidationRules('userGroupId', 'number', {
        optional: true,
        min: 1,
        max: Number.MAX_SAFE_INTEGER,
    }),
];

const patchMemberValidationRules = [
    ...createSignupValidationRules('userGroupId', 'number', {
        min: 1,
        max: Number.MAX_SAFE_INTEGER,
    }),
];

export {
    inviteUserValidationRules,
    acceptRequestValidationRules,
    patchMemberValidationRules,
    sharingConvertValidationMessageToErrorCode,
};
