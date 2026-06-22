import { createCurrencyCodeExistsRule } from 'src/utils/validation/currencyCodeExistsRule';
import { createSignupValidationRules } from 'src/utils/validation/routesInputValidation';
import { validatePathConfirmationCodeProperty } from 'src/utils/validation/validatePathConfirmationCodeProperty';

const patchProfileValidationRules = [
    ...createSignupValidationRules('locale', 'string', {
        optional: true,
        min: 4,
        max: 6,
    }),
    ...createSignupValidationRules('currencyCode', 'string', {
        optional: true,
        min: 1,
        max: 10,
    }),
    ...createSignupValidationRules('publicName', 'string', {
        optional: true,
        min: 3,
        max: 128,
    }),
    createCurrencyCodeExistsRule(true),
];

const requestEmailChangeValidationRules = [...createSignupValidationRules('newEmail', 'email', { max: 100 })];

const requestPasswordChangeValidationRules = [
    ...createSignupValidationRules('newPassword', 'password', { min: 5, max: 30 }),
    ...createSignupValidationRules('password', 'password', { min: 5, max: 30 }),
];

const confirmEmailChangeValidationRules = [
    validatePathConfirmationCodeProperty('confirmationCode'),
    ...createSignupValidationRules('newEmail', 'email', { max: 100 }),
];

const confirmPasswordChangeValidationRules = [validatePathConfirmationCodeProperty('confirmationCode')];

const refreshEmailChangeCodeValidationRules = [...createSignupValidationRules('newEmail', 'email', { max: 100 })];

export {
    patchProfileValidationRules,
    requestEmailChangeValidationRules,
    requestPasswordChangeValidationRules,
    confirmEmailChangeValidationRules,
    confirmPasswordChangeValidationRules,
    refreshEmailChangeCodeValidationRules,
};
