import { body } from 'express-validator';

import { createSignupValidationRules } from 'src/utils/validation/routesInputValidation';

const oauthValidationRules = [
    body('provider').isIn(['google', 'apple']).withMessage('Field provider must be "google" or "apple"'),
    body('idToken').isString().notEmpty().withMessage('Field idToken must be a non-empty string'),
    ...createSignupValidationRules('locale', 'string', { min: 4, max: 6, optional: true, onlyASCII: true, escapeHTML: true }),
    ...createSignupValidationRules('publicName', 'string', { min: 2, max: 40, optional: true, onlyASCII: true }),
    ...createSignupValidationRules('currencyCode', 'string', { min: 1, max: 10, optional: true }),
];

export default oauthValidationRules;
