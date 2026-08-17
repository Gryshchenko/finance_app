import { UserStatus, VALID_OAUTH_PROVIDERS } from '@tenpercent/shared';
import express from 'express';

import tokenVerify, { tokenLongVerify, tokenResetVerify } from 'middleware/tokenVerify';
import userIdVerify from 'middleware/userIdVerify';
import userStatusVerify from 'middleware/userStatusVerify';
import { AuthController } from 'src/controllers/AuthController';
import {
    confirmationCodeRule,
    currencyCodeRule,
    emailRule,
    enumRule,
    localeRule,
    nameRule,
    secretRule,
} from 'src/utils/validation/fieldRules';
import {
    forgetPasswordValidationRules,
    forgetConfirmPasswordValidationRules,
    forgetChangePasswordValidationRules,
} from 'src/utils/validation/forgetPasswordValidationRules';
import loginValidationRules, { logoutValidationRules } from 'src/utils/validation/loginValidationRules';
import oauthValidationRules from 'src/utils/validation/oauthValidationRules';
import refreshTokenValidation from 'src/utils/validation/refreshTokenValidationRules';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import { validateQuery } from 'src/utils/validation/validateQuery';

import routesInputValidation from '../utils/validation/routesInputValidation';

const router = express.Router();

/** Passwords are only bounded here; strength is enforced by the express-validator rules. */
const passwordRule = (optional = false) => secretRule({ optional, maxLength: 30 });

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
    routesInputValidation(loginValidationRules),
    AuthController.login,
);

router.post(
    '/oauth',
    validateQuery({}),
    sanitizeRequestBody({
        provider: enumRule(VALID_OAUTH_PROVIDERS, { optional: false }),
        idToken: secretRule(),
        locale: localeRule(),
        publicName: nameRule({ optional: true, minLength: 2, maxLength: 40 }),
        currencyCode: currencyCodeRule({ optional: true }),
    }),
    routesInputValidation(oauthValidationRules),
    AuthController.oauth,
);

router.post(
    '/forget',
    validateQuery({}),
    sanitizeRequestBody({ email: emailRule() }),
    routesInputValidation(forgetPasswordValidationRules),
    AuthController.forget,
);

router.post(
    '/forget-refresh',
    validateQuery({}),
    sanitizeRequestBody({ email: emailRule() }),
    routesInputValidation(forgetPasswordValidationRules),
    AuthController.forgetRefresh,
);

router.post(
    '/forget-confirm',
    validateQuery({}),
    sanitizeRequestBody({ email: emailRule(), confirmationCode: confirmationCodeRule() }),
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
