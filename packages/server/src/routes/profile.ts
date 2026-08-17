import { AVATAR_VARIANTS } from '@tenpercent/shared';
import express from 'express';

import { ProfileController } from 'controllers/ProfileController';
import {
    arrayRule,
    confirmationCodeRule,
    currencyCodeRule,
    emailRule,
    enumRule,
    hexColorRule,
    idRule,
    localeRule,
    nameRule,
    objectRule,
    secretRule,
} from 'src/utils/validation/fieldRules';
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

const passwordRule = () => secretRule({ maxLength: 30 });

/** Generated avatar: a variant the renderer knows plus the palette it is drawn with. */
const avatarRule = () =>
    objectRule({
        variant: enumRule(AVATAR_VARIANTS, { optional: false }),
        colors: arrayRule(hexColorRule({ optional: false }), { optional: false, minLength: 1, maxLength: 10 }),
    });

router.get('/', sanitizeRequestBody({}), validateQuery({}), ProfileController.get);

router.patch(
    '/',
    sanitizeRequestBody({
        locale: localeRule(),
        currencyCode: currencyCodeRule({ optional: true }),
        publicName: nameRule({ optional: true, minLength: 3 }),
        avatar: avatarRule(),
    }),
    validateQuery({}),
    routesInputValidation(patchProfileValidationRules),
    ProfileController.patch,
);

router.post(
    '/email-change',
    sanitizeRequestBody({ newEmail: emailRule({ maxLength: 100 }) }),
    validateQuery({}),
    routesInputValidation(requestEmailChangeValidationRules),
    ProfileController.requestEmailChange,
);

router.post(
    '/email-change/verify',
    sanitizeRequestBody({
        confirmationCode: confirmationCodeRule(),
        newEmail: emailRule({ maxLength: 100 }),
    }),
    validateQuery({}),
    routesInputValidation(confirmEmailChangeValidationRules),
    ProfileController.confirmEmailChange,
);
router.post(
    '/email-change/resend',
    sanitizeRequestBody({ newEmail: emailRule({ maxLength: 100 }) }),
    validateQuery({}),
    routesInputValidation(refreshEmailChangeCodeValidationRules),
    ProfileController.refreshConfirmationCodeForEmailChange,
);

router.post(
    '/password-change',
    sanitizeRequestBody({ newPassword: passwordRule(), password: passwordRule() }),
    validateQuery({}),
    routesInputValidation(requestPasswordChangeValidationRules),
    ProfileController.requestPasswordChange,
);

router.post(
    '/password-change/verify',
    // `tokenLong` is best-effort: the controller blacklists it when present, so a client that
    // only holds an access token must still be able to confirm.
    sanitizeRequestBody({ confirmationCode: confirmationCodeRule(), tokenLong: secretRule({ optional: true }) }),
    validateQuery({}),
    routesInputValidation(confirmPasswordChangeValidationRules),
    ProfileController.confirmPasswordChange,
);

router.post(
    // `confirmationId` had no validation rule of its own; the schema is the only thing
    // standing between the request and `Number(confirmationId)` in the controller.
    '/password-change/resend',
    sanitizeRequestBody({ confirmationId: idRule({ optional: false }) }),
    validateQuery({}),
    ProfileController.refreshConfirmationCodeForPasswordChange,
);

export default router;
