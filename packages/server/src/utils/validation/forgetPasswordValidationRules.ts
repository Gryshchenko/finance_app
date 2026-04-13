import { createSignupValidationRules } from 'src/utils/validation/routesInputValidation';

export const forgetPasswordValidationRules = [...createSignupValidationRules('email', 'email', { max: 150 })];

export const forgetConfirmPasswordValidationRules = [
    ...createSignupValidationRules('email', 'email', { max: 150 }),
    ...createSignupValidationRules('confirmationCode', 'number', { min: 0, max: 99999999 }),
];
export const forgetChangePasswordValidationRules = [
    ...createSignupValidationRules('newPassword', 'password', {
        min: 5,
        max: 30,
    }),
];
