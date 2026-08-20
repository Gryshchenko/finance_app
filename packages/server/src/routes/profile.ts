import { AVATAR_VARIANTS } from '@tenpercent/shared';
import express, { Request } from 'express';

import { ProfileController } from 'controllers/ProfileController';
import { codeAttemptLimiter } from 'middleware/limiters';
import { rateLimitMiddleware } from 'middleware/rateLimit';
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
    verifyPasswordChangeCodeValidationRules,
    applyPasswordChangeValidationRules,
    refreshEmailChangeCodeValidationRules,
} from 'src/utils/validation/profileValidationRules';
import routesInputValidation from 'src/utils/validation/routesInputValidation';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import { validateQuery } from 'src/utils/validation/validateQuery';

const router = express.Router({ mergeParams: true });

const passwordRule = () => secretRule({ maxLength: 30 });

/**
 * Guesses against the emailed code, budgeted per account rather than per IP: these routes are
 * authenticated, so the account is the thing under attack and the only stable thing to count.
 * `verify` needs this most - it reports whether a code is right without spending it, which is
 * a free oracle otherwise.
 */
const perUserKey = (req: Request) => String((req.user as { userId?: number } | undefined)?.userId ?? req.ip ?? 'unknown');
const codeAttemptLimit = rateLimitMiddleware(codeAttemptLimiter, perUserKey);

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

// Step 1: prove the current password, get a code in the mailbox. The new password is not
// part of this request - it is chosen after the code is checked, and only `apply` receives it.
router.post(
    '/password-change',
    sanitizeRequestBody({ password: passwordRule() }),
    validateQuery({}),
    routesInputValidation(requestPasswordChangeValidationRules),
    ProfileController.requestPasswordChange,
);

// Step 2: is this code right? Answers 200 or 400 and changes nothing.
router.post(
    '/password-change/verify',
    sanitizeRequestBody({ confirmationCode: confirmationCodeRule() }),
    validateQuery({}),
    routesInputValidation(verifyPasswordChangeCodeValidationRules),
    codeAttemptLimit,
    ProfileController.verifyPasswordChangeCode,
);

// Step 3: the code once more, now with the password to set.
router.post(
    '/password-change/apply',
    // `tokenLong` is best-effort: the controller blacklists it when present, so a client that
    // only holds an access token must still be able to finish.
    sanitizeRequestBody({
        confirmationCode: confirmationCodeRule(),
        newPassword: passwordRule(),
        tokenLong: secretRule({ optional: true }),
    }),
    validateQuery({}),
    routesInputValidation(applyPasswordChangeValidationRules),
    codeAttemptLimit,
    ProfileController.applyPasswordChange,
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
