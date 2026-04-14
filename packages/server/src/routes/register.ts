import express from 'express';

import emailConfirmation from 'routes/emailConfirmation';
import { RegisterController } from 'src/controllers/RegisterController';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import signupValidationRules from 'src/utils/validation/signupValidationRules';
import { validatePathQueryProperty } from 'src/utils/validation/validatePathQueryProperty';
import { validateQuery } from 'src/utils/validation/validateQuery';

import routesInputValidation from '../utils/validation/routesInputValidation';

const router = express.Router();

router.post(
    '/signup',
    validateQuery({}),
    sanitizeRequestBody(['email', 'password', 'locale', 'publicName', 'currencyCode']),
    routesInputValidation(signupValidationRules),
    RegisterController.signup,
);

router.use('/signup/:userId/email-confirmation', routesInputValidation([validatePathQueryProperty('userId')]), emailConfirmation);

export default router;
