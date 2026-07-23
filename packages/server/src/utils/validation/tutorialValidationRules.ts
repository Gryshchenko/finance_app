import { createSignupValidationRules } from 'src/utils/validation/routesInputValidation';

const patchTutorialValidationRules = [
    ...createSignupValidationRules('isOnBoardingTutorialView', 'boolean', {
        optional: true,
    }),
    ...createSignupValidationRules('isAccountTutorialView', 'boolean', {
        optional: true,
    }),
    ...createSignupValidationRules('isDashboardTutorialView', 'boolean', {
        optional: true,
    }),
    ...createSignupValidationRules('isBalanceInsightsTutorialView', 'boolean', {
        optional: true,
    }),
    ...createSignupValidationRules('isIncomeTutorialView', 'boolean', {
        optional: true,
    }),
    ...createSignupValidationRules('isSharingTutorialView', 'boolean', {
        optional: true,
    }),
    ...createSignupValidationRules('isCategoryTutorialView', 'boolean', {
        optional: true,
    }),
    ...createSignupValidationRules('onBoardingViewedSlidesCount', 'number', {
        optional: true,
        min: 0,
        max: 100,
    }),
];

export { patchTutorialValidationRules };
