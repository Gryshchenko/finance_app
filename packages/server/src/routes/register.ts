import express from 'express';

import { signupEmailLimiter, signupIpLimiter } from 'middleware/limiters';
import { rateLimitMiddleware } from 'middleware/rateLimit';
import emailConfirmation from 'routes/emailConfirmation';
import { RegisterController } from 'src/controllers/RegisterController';
import { currencyCodeRule, emailRule, localeRule, nameRule, secretRule } from 'src/utils/validation/fieldRules';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import signupValidationRules from 'src/utils/validation/signupValidationRules';
import { validatePathQueryProperty } from 'src/utils/validation/validatePathQueryProperty';
import { validateQuery } from 'src/utils/validation/validateQuery';

import routesInputValidation from '../utils/validation/routesInputValidation';

const router = express.Router();

/**
 * Account enumeration on `/signup`: a taken address answers `SIGNUP_USER_ALREADY_EXISTS_ERROR`,
 * a free one answers 200 with a session, so the response itself tells an attacker whether an
 * address is registered. Two of the three legs are closed here and in `UserRegistrationService`:
 *
 *   - `signupIpLimiter` bounds a single source to 10 distinct addresses per hour
 *     (`signupEmailLimiter` is keyed by address and does nothing against a list walked one
 *     attempt each);
 *   - the argon2 hash is spent even when the address is taken, so the two paths take the same time.
 *
 * The response body still differs. Closing that means signup always answering 202 "check your
 * inbox" and moving session creation behind email confirmation - a product change, since the
 * client currently logs the user in straight from this response.
 */
router.post(
    '/signup',
    validateQuery({}),
    sanitizeRequestBody({
        email: emailRule(),
        password: secretRule({ maxLength: 30 }),
        locale: localeRule(),
        publicName: nameRule({ minLength: 2, maxLength: 40 }),
        currencyCode: currencyCodeRule(),
    }),
    rateLimitMiddleware(signupIpLimiter),
    rateLimitMiddleware(signupEmailLimiter, (req) => String(req.body?.email ?? req.ip ?? 'unknown').toLowerCase()),
    routesInputValidation(signupValidationRules),
    RegisterController.signup,
);

router.use('/signup/:userId/email-confirmation', routesInputValidation([validatePathQueryProperty('userId')]), emailConfirmation);

export default router;
