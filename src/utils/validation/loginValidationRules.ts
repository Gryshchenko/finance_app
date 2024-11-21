import { createSignupValidationRules } from 'src/utils/validation/routesInputValidation';

const loginValidationRules = [
    ...createSignupValidationRules('password', 'password', {
        min: 5,
        max: 30,
    }),
    ...createSignupValidationRules('email', 'email', { max: 30 }),
];

export default loginValidationRules;
