import { createSignupValidationRules } from 'src/utils/validation/routesInputValidation';
import { validatePathConfirmationCodeProperty } from 'src/utils/validation/validatePathConfirmationCodeProperty';

const patchProfileValidationRules = [
    ...createSignupValidationRules('locale', 'string', {
        optional: true,
        min: 4,
        max: 6,
    }),
    ...createSignupValidationRules('currencyId', 'number', {
        optional: true,
        min: Number.MIN_SAFE_INTEGER,
        max: Number.MAX_SAFE_INTEGER,
    }),
    ...createSignupValidationRules('publicName', 'string', {
        optional: true,
        min: 3,
        max: 128,
    }),
];

const requestEmailChangeValidationRules = [...createSignupValidationRules('newEmail', 'email', { max: 100 })];

const requestPasswordChangeValidationRules = [
    ...createSignupValidationRules('newPassword', 'password', { min: 5, max: 30 }),
    ...createSignupValidationRules('password', 'password', { min: 5, max: 30 }),
];

const confirmChangeValidationRules = [validatePathConfirmationCodeProperty('confirmationCode')];

const refreshConfirmationCodeValidationRules = [
    ...createSignupValidationRules('confirmationId', 'number', { min: 1, max: Number.MAX_SAFE_INTEGER }),
];

export {
    patchProfileValidationRules,
    requestEmailChangeValidationRules,
    requestPasswordChangeValidationRules,
    confirmChangeValidationRules,
    refreshConfirmationCodeValidationRules,
};
