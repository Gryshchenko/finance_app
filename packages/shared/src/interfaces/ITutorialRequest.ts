export interface ITutorialRequest {
    isOnBoardingTutorialView?: boolean;
    /** How many onboarding slides the user actually viewed before finishing/skipping. */
    onBoardingViewedSlidesCount?: number;
    isDashboardTutorialView?: boolean;
    isAccountTutorialView?: boolean;
    isCategoryTutorialView?: boolean;
    isIncomeTutorialView?: boolean;
    isBalanceInsightsTutorialView?: boolean;
    isSharingTutorialView?: boolean;
}
