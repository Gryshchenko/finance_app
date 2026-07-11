import { UserStatus } from '@tenpercent/shared';
import express from 'express';

import tokenVerify, { tokenLongVerify, tokenResetVerify } from 'middleware/tokenVerify';
import userIdVerify from 'middleware/userIdVerify';
import userStatusVerify from 'middleware/userStatusVerify';
import { AuthController } from 'src/controllers/AuthController';
import {
    forgetPasswordValidationRules,
    forgetConfirmPasswordValidationRules,
    forgetChangePasswordValidationRules,
} from 'src/utils/validation/forgetPasswordValidationRules';
import loginValidationRules from 'src/utils/validation/loginValidationRules';
import oauthValidationRules from 'src/utils/validation/oauthValidationRules';
import refreshTokenValidation from 'src/utils/validation/refreshTokenValidationRules';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import { validateQuery } from 'src/utils/validation/validateQuery';

import routesInputValidation from '../utils/validation/routesInputValidation';

const router = express.Router();

router.post('/logout', validateQuery({}), tokenVerify, routesInputValidation([]), AuthController.logout);

router.post(
    '/:userId/refresh',
    validateQuery({}),
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
    sanitizeRequestBody(['email', 'password']),
    routesInputValidation(loginValidationRules),
    AuthController.login,
);

router.post(
    '/oauth',
    validateQuery({}),
    sanitizeRequestBody(['provider', 'idToken', 'locale', 'publicName', 'currencyCode']),
    routesInputValidation(oauthValidationRules),
    AuthController.oauth,
);

router.post(
    '/forget',
    validateQuery({}),
    sanitizeRequestBody(['email']),
    routesInputValidation(forgetPasswordValidationRules),
    AuthController.forget,
);

router.post(
    '/forget-refresh',
    validateQuery({}),
    sanitizeRequestBody(['email']),
    routesInputValidation(forgetPasswordValidationRules),
    AuthController.forgetRefresh,
);

router.post(
    '/forget-confirm',
    validateQuery({}),
    sanitizeRequestBody(['email', 'confirmationCode']),
    routesInputValidation(forgetConfirmPasswordValidationRules),
    AuthController.forgetConfirm,
);

router.post(
    '/:userId/forget-change',
    tokenResetVerify,
    userIdVerify,
    validateQuery({}),
    sanitizeRequestBody(['newPassword']),
    routesInputValidation(forgetChangePasswordValidationRules),
    AuthController.forgetChange,
);

export default router;
