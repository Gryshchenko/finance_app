import express from 'express';

import emailConfirmation from 'routes/emailConfirmation';
import { RegisterController } from 'src/controllers/RegisterController';
import { currencyCodeRule, emailRule, localeRule, nameRule, secretRule } from 'src/utils/validation/fieldRules';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import signupValidationRules from 'src/utils/validation/signupValidationRules';
import { validatePathQueryProperty } from 'src/utils/validation/validatePathQueryProperty';
import { validateQuery } from 'src/utils/validation/validateQuery';

import routesInputValidation from '../utils/validation/routesInputValidation';

const router = express.Router();

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
    routesInputValidation(signupValidationRules),
    RegisterController.signup,
);

router.use('/signup/:userId/email-confirmation', routesInputValidation([validatePathQueryProperty('userId')]), emailConfirmation);

export default router;
