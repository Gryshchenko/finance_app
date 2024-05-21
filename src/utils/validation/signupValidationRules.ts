import { createSignupValidationRules } from 'src/utils/validation/routesInputValidation';

const signupValidationRules = [
    ...createSignupValidationRules('password', 'password', {
        min: 5,
        max: 30,
    }),
    ...createSignupValidationRules('email', 'email', { max: 30 }),
    ...createSignupValidationRules('locale', 'string', {
        min: 4,
        max: 6,
        optional: true,
        onlyASCII: true,
        escapeHTML: true,
    }),
];

export default signupValidationRules;
