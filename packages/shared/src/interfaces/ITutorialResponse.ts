export interface ITutorialResponse {
    id: string;
    userId: number;
    isOnBoardingTutorialView: boolean;
    onBoardingViewedSlidesCount?: number | null;
    isDashboardTutorialView: boolean;
    isAccountTutorialView: boolean;
    isCategoryTutorialView: boolean;
    isIncomeTutorialView: boolean;
    isBalanceInsightsTutorialView: boolean;
    isSharingTutorialView: boolean;
}
