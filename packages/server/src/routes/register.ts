import express from 'express';
import signupValidationRules from 'src/utils/validation/signupValidationRules';
import routesInputValidation from '../utils/validation/routesInputValidation';
import { RegisterController } from 'src/controllers/RegisterController';
import { sanitizeRequestBody } from 'src/utils/validation/sanitizeRequestBody';
import { validateQuery } from 'src/utils/validation/validateQuery';
import { validatePathQueryProperty } from 'src/utils/validation/validatePathQueryProperty';
import emailConfirmation from 'routes/emailConfirmation';

const router = express.Router();

router.post(
    '/signup',
    sanitizeRequestBody(['email', 'password', 'locale', 'publicName', 'currencyCode']),
    validateQuery({}),
    routesInputValidation(signupValidationRules),
    RegisterController.signup,
);

router.use('/signup/:userId/email-confirmation', routesInputValidation([validatePathQueryProperty('userId')]), emailConfirmation);

export default router;
