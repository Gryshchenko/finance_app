import express from 'express';

import { ProfileController } from 'controllers/ProfileController';
import {
    patchProfileValidationRules,
    requestEmailChangeValidationRules,
    requestPasswordChangeValidationRules,
    confirmEmailChangeValidationRules,
    confirmPasswordChangeValidationRules,
    refreshEmailChangeCodeValidationRules,
} from 'src/utils/validation/profileValidationRules';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import { validateQuery } from 'src/utils/validation/validateQuery';

const router = express.Router({ mergeParams: true });

router.get('/', sanitizeRequestBody([]), validateQuery({}), ProfileController.get);

router.patch(
    '/',
    sanitizeRequestBody(['locale', 'currencyId', 'publicName']),
    validateQuery({}),
    routesInputValidation(patchProfileValidationRules),
    ProfileController.patch,
);

router.post(
    '/email-change',
    sanitizeRequestBody(['newEmail']),
    validateQuery({}),
    routesInputValidation(requestEmailChangeValidationRules),
    ProfileController.requestEmailChange,
);

router.post(
    '/email-change/verify',
    sanitizeRequestBody(['confirmationCode', 'newEmail']),
    validateQuery({}),
    routesInputValidation(confirmEmailChangeValidationRules),
    ProfileController.confirmEmailChange,
);
router.post(
    '/email-change/resend',
    sanitizeRequestBody(['newEmail']),
    validateQuery({}),
    routesInputValidation(refreshEmailChangeCodeValidationRules),
    ProfileController.refreshConfirmationCodeForEmailChange,
);

router.post(
    '/password-change',
    sanitizeRequestBody(['newPassword', 'password']),
    validateQuery({}),
    routesInputValidation(requestPasswordChangeValidationRules),
    ProfileController.requestPasswordChange,
);

router.post(
    '/password-change/verify',
    sanitizeRequestBody(['confirmationCode']),
    validateQuery({}),
    routesInputValidation(confirmPasswordChangeValidationRules),
    ProfileController.confirmPasswordChange,
);

router.post(
    '/password-change/resend',
    sanitizeRequestBody(['confirmationId']),
    validateQuery({}),
    ProfileController.refreshConfirmationCodeForPasswordChange,
);

export default router;
