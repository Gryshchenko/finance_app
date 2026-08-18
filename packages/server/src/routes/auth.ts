import { UserStatus } from '@tenpercent/shared';
import express, { Request } from 'express';

import { codeAttemptLimiter, emailDispatchLimiter } from 'middleware/limiters';
import { loginRateLimit } from 'middleware/loginRateLimit';
import { rateLimitMiddleware } from 'middleware/rateLimit';
import tokenVerify, { tokenLongVerify, tokenResetVerify } from 'middleware/tokenVerify';
import userIdVerify from 'middleware/userIdVerify';
import userStatusVerify from 'middleware/userStatusVerify';
import { AuthController } from 'src/controllers/AuthController';
import { confirmationCodeRule, emailRule, secretRule } from 'src/utils/validation/fieldRules';
import {
    forgetPasswordValidationRules,
    forgetConfirmPasswordValidationRules,
    forgetChangePasswordValidationRules,
} from 'src/utils/validation/forgetPasswordValidationRules';
import loginValidationRules, { logoutValidationRules } from 'src/utils/validation/loginValidationRules';
import refreshTokenValidation from 'src/utils/validation/refreshTokenValidationRules';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import { validateQuery } from 'src/utils/validation/validateQuery';

import routesInputValidation from '../utils/validation/routesInputValidation';

const router = express.Router();

const passwordRule = (optional = false) => secretRule({ optional, maxLength: 30 });

/**
 * Both budgets are keyed by the address the request is about, not by the caller: recovery is
 * unauthenticated, so the account under attack is the only stable thing to count against.
 */
const perEmailKey = (req: Request) => String(req.body?.email ?? req.ip ?? 'unknown').toLowerCase();

/** Sends a mail. */
const emailDispatchLimit = rateLimitMiddleware(emailDispatchLimiter, perEmailKey);

/** Checks a code without sending anything. */
const codeAttemptLimit = rateLimitMiddleware(codeAttemptLimiter, perEmailKey);

router.post(
    '/logout',
    validateQuery({}),
    sanitizeRequestBody({ token: secretRule({ optional: true }) }),
    tokenVerify,
    routesInputValidation(logoutValidationRules),
    AuthController.logout,
);

router.post(
    '/:userId/refresh',
    validateQuery({}),
    sanitizeRequestBody({ token: secretRule() }),
    routesInputValidation(refreshTokenValidation),
    tokenLongVerify,
    userIdVerify,
    userStatusVerify(UserStatus.ACTIVE),
    AuthController.refresh,
);

router.get('/:userId/verify', validateQuery({}), tokenVerify, userIdVerify, routesInputValidation([]), AuthController.verify);

router.post(
    '/login',
    validateQuery({}),
    sanitizeRequestBody({ email: emailRule(), password: passwordRule() }),
    loginRateLimit,
    routesInputValidation(loginValidationRules),
    AuthController.login,
);

// router.post(
//     '/oauth',
//     rateLimitMiddleware(readLimiter),
//     validateQuery({}),
//     sanitizeRequestBody({
//         provider: enumRule(VALID_OAUTH_PROVIDERS, { optional: false }),
//         idToken: secretRule(),
//         locale: localeRule(),
//         publicName: nameRule({ optional: true, minLength: 2, maxLength: 40 }),
//         currencyCode: currencyCodeRule({ optional: true }),
//     }),
//     routesInputValidation(oauthValidationRules),
//     AuthController.oauth,
// );

router.post(
    '/forget',
    validateQuery({}),
    sanitizeRequestBody({ email: emailRule() }),
    emailDispatchLimit,
    routesInputValidation(forgetPasswordValidationRules),
    AuthController.forget,
);

router.post(
    '/forget-refresh',
    validateQuery({}),
    sanitizeRequestBody({ email: emailRule() }),
    emailDispatchLimit,
    routesInputValidation(forgetPasswordValidationRules),
    AuthController.forgetRefresh,
);

router.post(
    '/forget-confirm',
    validateQuery({}),
    sanitizeRequestBody({ email: emailRule(), confirmationCode: confirmationCodeRule() }),
    codeAttemptLimit,
    routesInputValidation(forgetConfirmPasswordValidationRules),
    AuthController.forgetConfirm,
);

router.post(
    '/:userId/forget-change',
    tokenResetVerify,
    userIdVerify,
    validateQuery({}),
    sanitizeRequestBody({ newPassword: passwordRule() }),
    routesInputValidation(forgetChangePasswordValidationRules),
    AuthController.forgetChange,
);

export default router;
