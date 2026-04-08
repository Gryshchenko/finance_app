import express from 'express';
import { ProfileController } from 'controllers/ProfileController';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import { validateQuery } from 'src/utils/validation/validateQuery';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import {
    patchProfileValidationRules,
    requestEmailChangeValidationRules,
    requestPasswordChangeValidationRules,
    confirmChangeValidationRules,
    refreshConfirmationCodeValidationRules,
} from 'src/utils/validation/profileValidationRules';

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
    sanitizeRequestBody(['confirmationCode']),
    validateQuery({}),
    routesInputValidation(confirmChangeValidationRules),
    ProfileController.confirmEmailChange,
);
router.post(
    '/email-change/resend',
    sanitizeRequestBody(['confirmationId']),
    validateQuery({}),
    routesInputValidation(refreshConfirmationCodeValidationRules),
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
    routesInputValidation(confirmChangeValidationRules),
    ProfileController.confirmPasswordChange,
);

router.post(
    '/password-change/resend',
    sanitizeRequestBody(['confirmationId']),
    validateQuery({}),
    routesInputValidation(refreshConfirmationCodeValidationRules),
    ProfileController.refreshConfirmationCodeForPasswordChange,
);

export default router;
