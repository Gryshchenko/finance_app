import express from 'express';

import routesInputValidation from '../utils/validation/routesInputValidation';
import tokenVerify, { tokenLongVerify, tokenResetVerify } from 'middleware/tokenVerify';
import loginValidationRules from 'src/utils/validation/loginValidationRules';
import { AuthController } from 'src/controllers/AuthController';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import { validateQuery } from 'src/utils/validation/validateQuery';
import userIdVerify from 'middleware/userIdVerify';
import refreshTokenValidation from 'src/utils/validation/refreshTokenValidationRules';
import {
    forgetPasswordValidationRules,
    forgetConfirmPasswordValidationRules,
    forgetChangePasswordValidationRules,
} from 'src/utils/validation/forgetPasswordValidationRules';

const router = express.Router();

router.post('/logout', validateQuery({}), tokenVerify, routesInputValidation([]), AuthController.logout);

router.post(
    '/:userId/refresh',
    validateQuery({}),
    routesInputValidation(refreshTokenValidation),
    tokenLongVerify,
    userIdVerify,
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
