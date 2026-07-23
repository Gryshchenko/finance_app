import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

import { Icon, IconTypes } from '@/components/Icon';
import { Text } from '@/components/Text';
import { translate } from '@/i18n/translate';
import { TutorialWelcomeSlide } from '@/screens/OnboardingTutorialScreen/TutorialWelcomeSlide';
import { useAppTheme } from '@/theme/context';

import {
    $absoluteIcon,
    $avatarSq,
    $balanceRow,
    $balanceStats,
    $baseline,
    $box,
    $boxDashed,
    $boxFill,
    $boxLetter,
    $boxShadow,
    $boxShadowStrong,
    $boxWhite,
    $chevron,
    $chip,
    $chipTitle,
    $chipValue,
    $eyebrow,
    $eyebrowSm,
    $flex1,
    $ghostBox,
    $incomeAmount,
    $insightsWrap,
    $listCard,
    $listRow,
    $metricCard,
    $metricLabel,
    $metricRow,
    $metricValue,
    $previewWide,
    $rowBorder,
    $rowGap,
    $rowSub,
    $rowTitle,
    $rowTitleBold,
    $spread,
    $stat,
    $statCol,
    $targetHighlight,
    $totalDecimals,
    $totalValue,
    $trendArrow,
    $trendBadge,
    $trendCard,
    $trendTitle,
    ACCOUNT_COLORS,
} from './styles';

export type SlideKey = 'welcome' | 'accounts' | 'dashboard' | 'insights' | 'income' | 'sharing' | 'categories';

export function SlidePreview({ slideKey }: { slideKey: SlideKey }) {
    switch (slideKey) {
        case 'welcome':
            return <TutorialWelcomeSlide />;
        case 'accounts':
            return <AccountsPreview />;
        case 'dashboard':
            return <DashboardPreview />;
        case 'insights':
            return <InsightsPreview />;
        case 'income':
            return <IncomePreview />;
        case 'sharing':
            return <SharingPreview />;
        case 'categories':
            return <CategoriesPreview />;
    }
}

// Box mirrors dashboard/Box AccountBox: 56×56, borderRadius 2, first letter (funnelSans bold, white).
function AccountChip({ color, title, value }: { color: string; title: string; value?: string }) {
    const { themed } = useAppTheme();
    return (
        <View style={$chip}>
            <View style={[$box, { backgroundColor: color }, $boxShadow]}>
                <Text text={title.charAt(0).toUpperCase()} style={themed($boxLetter)} />
            </View>
            <Text text={title} style={themed($chipTitle)} numberOfLines={1} />
            {!!value && <Text text={value} style={themed($chipValue)} />}
        </View>
    );
}

function CategoryChip({ icon, title, value }: { icon: IconTypes; title: string; value?: string }) {
    const {
        themed,
        theme: { colors },
    } = useAppTheme();
    return (
        <View style={$chip}>
            <View style={[$box, themed($boxWhite)]}>
                <Icon icon={icon} size={24} color={colors.palette.neutral600} />
            </View>
            <Text text={title} style={themed($chipTitle)} numberOfLines={1} />
            {!!value && <Text text={value} style={themed($chipValue)} />}
        </View>
    );
}

function AccountsPreview() {
    return (
        <View style={$rowGap}>
            <AccountChip
                color={ACCOUNT_COLORS.navy}
                title={translate('onboardingTutorialScreen:preview.cash')}
                value="€1,250.00"
            />
            <AccountChip
                color={ACCOUNT_COLORS.teal}
                title={translate('onboardingTutorialScreen:preview.bankCard')}
                value="€8,420.50"
            />
            <AccountChip
                color={ACCOUNT_COLORS.green}
                title={translate('onboardingTutorialScreen:preview.savings')}
                value="€12,000.00"
            />
        </View>
    );
}

function DashboardPreview() {
    const {
        themed,
        theme: { colors },
    } = useAppTheme();
    return (
        <View style={$previewWide}>
            <View style={$balanceRow}>
                <View>
                    <Text tx="onboardingTutorialScreen:preview.totalBalance" style={themed($eyebrow)} />
                    <View style={$baseline}>
                        <Text text="€21,670" style={themed($totalValue)} />
                        <Text text=".50" style={themed($totalDecimals)} />
                    </View>
                </View>
                <View style={$balanceStats}>
                    <View style={$statCol}>
                        <Text tx="onboardingTutorialScreen:preview.income" style={themed($eyebrowSm)} />
                        <Text text="+€3,200.00" style={[themed($stat), { color: colors.palette.green400 }]} />
                    </View>
                    <View style={$statCol}>
                        <Text tx="onboardingTutorialScreen:preview.expenses" style={themed($eyebrowSm)} />
                        <Text text="€1,890.40" style={[themed($stat), { color: colors.palette.neutral900 }]} />
                    </View>
                </View>
            </View>
            <View style={$rowGap}>
                <AccountChip
                    color={ACCOUNT_COLORS.navy}
                    title={translate('onboardingTutorialScreen:preview.cash')}
                    value="€1,250"
                />
                <AccountChip
                    color={ACCOUNT_COLORS.teal}
                    title={translate('onboardingTutorialScreen:preview.bankCard')}
                    value="€8,420"
                />
                <AccountChip
                    color={ACCOUNT_COLORS.green}
                    title={translate('onboardingTutorialScreen:preview.savings')}
                    value="€12,000"
                />
                <View style={$chip}>
                    <View style={[$box, themed($boxDashed)]}>
                        <Icon icon="add" size={24} color={colors.palette.neutral600} />
                    </View>
                    <Text tx="onboardingTutorialScreen:preview.add" style={themed($chipTitle)} />
                </View>
            </View>
        </View>
    );
}

function InsightsPreview() {
    const {
        themed,
        theme: { colors },
    } = useAppTheme();
    return (
        <View style={$insightsWrap}>
            <View style={$metricRow}>
                <View style={themed($metricCard)}>
                    <Text tx="onboardingTutorialScreen:preview.month" style={themed($eyebrow)} />
                    <View>
                        <Text tx="onboardingTutorialScreen:preview.totalIncome" style={themed($metricLabel)} />
                        <Text text="+€3,200.00" style={themed($metricValue)} />
                    </View>
                </View>
                <View style={themed($metricCard)}>
                    <Text tx="onboardingTutorialScreen:preview.allAccounts" style={themed($eyebrow)} />
                    <View>
                        <Text tx="onboardingTutorialScreen:preview.totalBalance" style={themed($metricLabel)} />
                        <Text text="€21,670.50" style={themed($metricValue)} />
                    </View>
                </View>
            </View>
            <View style={themed($trendCard)}>
                <View style={$flex1}>
                    <Text tx="onboardingTutorialScreen:preview.trendVs" style={themed($eyebrow)} />
                    <Text tx="onboardingTutorialScreen:preview.growing" style={themed($trendTitle)} />
                </View>
                <View style={themed($trendBadge)}>
                    <Text text="↗" style={themed($trendArrow)} />
                    <Text text="+12.4%" style={[themed($stat), { color: colors.palette.green400 }]} />
                </View>
            </View>
        </View>
    );
}

function IncomePreview() {
    const { themed } = useAppTheme();
    const salary = translate('onboardingTutorialScreen:preview.salary');
    const freelance = translate('onboardingTutorialScreen:preview.freelance');
    return (
        <View style={themed($listCard)}>
            <View style={[$listRow, themed($rowBorder)]}>
                <View style={[$avatarSq, { backgroundColor: ACCOUNT_COLORS.teal }]}>
                    <Text text={salary.charAt(0).toUpperCase()} style={themed($boxLetter)} />
                </View>
                <View style={$flex1}>
                    <Text text={salary} style={themed($rowTitle)} />
                    <Text tx="onboardingTutorialScreen:preview.monthly" style={themed($rowSub)} />
                </View>
                <Text text="+€2,800.00" style={themed($incomeAmount)} />
            </View>
            <View style={$listRow}>
                <View style={[$avatarSq, { backgroundColor: ACCOUNT_COLORS.blue }]}>
                    <Text text={freelance.charAt(0).toUpperCase()} style={themed($boxLetter)} />
                </View>
                <View style={$flex1}>
                    <Text text={freelance} style={themed($rowTitle)} />
                    <Text tx="onboardingTutorialScreen:preview.occasional" style={themed($rowSub)} />
                </View>
                <Text text="+€400.00" style={themed($incomeAmount)} />
            </View>
        </View>
    );
}

function SharingPreview() {
    const { themed } = useAppTheme();
    return (
        <View style={themed($listCard)}>
            <View style={[$listRow, themed($rowBorder)]}>
                <View style={$flex1}>
                    <View style={$spread}>
                        <Text tx="onboardingTutorialScreen:preview.familyBudget" style={themed($rowTitleBold)} />
                        <Text tx="onboardingTutorialScreen:preview.familyMembers" style={themed($rowSub)} />
                    </View>
                    <Text tx="onboardingTutorialScreen:preview.familyDescription" style={themed($rowSub)} numberOfLines={1} />
                </View>
                <Text text="›" style={themed($chevron)} />
            </View>
            <View style={$listRow}>
                <View style={$flex1}>
                    <View style={$spread}>
                        <Text tx="onboardingTutorialScreen:preview.tripBudget" style={themed($rowTitleBold)} />
                        <Text tx="onboardingTutorialScreen:preview.tripMembers" style={themed($rowSub)} />
                    </View>
                    <Text tx="onboardingTutorialScreen:preview.tripDescription" style={themed($rowSub)} numberOfLines={1} />
                </View>
                <Text text="›" style={themed($chevron)} />
            </View>
        </View>
    );
}

// Categories slide: looping drag-and-drop demo. A "Cash" account box lifts, flies
// onto the "Restaurants" category (which highlights as a drop target), and the
// source slot shows a dashed placeholder — mirroring dashboard/Box/Box.tsx.
function CategoriesPreview() {
    const {
        themed,
        theme: { colors },
    } = useAppTheme();
    const progress = useRef(new Animated.Value(0)).current;
    const cash = translate('onboardingTutorialScreen:preview.cash');

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.delay(400),
                Animated.timing(progress, {
                    toValue: 1,
                    duration: 2600,
                    easing: Easing.inOut(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.delay(600),
                Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [progress]);

    // Source (Cash) sits top-left; Restaurants target is one row down, one column right.
    const translateX = progress.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, 82, 82] });
    const translateY = progress.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, 95, 95] });
    const flyOpacity = progress.interpolate({ inputRange: [0, 0.08, 0.7, 0.82], outputRange: [0, 1, 1, 0] });
    const sourceOpacity = progress.interpolate({ inputRange: [0, 0.08], outputRange: [1, 0] });
    const targetHighlight = progress.interpolate({ inputRange: [0, 0.45, 0.7, 0.85], outputRange: [0, 1, 1, 0] });

    return (
        <View style={$previewWide}>
            <View style={$rowGap}>
                <View style={$chip}>
                    <View style={[$box, themed($boxDashed)]}>
                        <Animated.View
                            style={[$boxFill, { backgroundColor: ACCOUNT_COLORS.navy, opacity: sourceOpacity }, $boxShadow]}
                        >
                            <Text text={cash.charAt(0).toUpperCase()} style={themed($boxLetter)} />
                        </Animated.View>
                    </View>
                    <Text text={cash} style={themed($chipTitle)} />
                </View>
                <AccountChip color={ACCOUNT_COLORS.teal} title={translate('onboardingTutorialScreen:preview.bankCard')} />
            </View>

            <View style={$rowGap}>
                <CategoryChip
                    icon="shoppingCart"
                    title={translate('onboardingTutorialScreen:preview.groceries')}
                    value="€430.20"
                />
                <View style={$chip}>
                    <View style={[$box, themed($boxWhite)]}>
                        <Animated.View style={[$boxFill, themed($targetHighlight), { opacity: targetHighlight }]} />
                        <Icon icon="restaurant" size={24} color={colors.palette.neutral600} style={$absoluteIcon} />
                    </View>
                    <Text tx="onboardingTutorialScreen:preview.restaurants" style={themed($chipTitle)} />
                    <Text text="€212.80" style={themed($chipValue)} />
                </View>
                <CategoryChip icon="bus" title={translate('onboardingTutorialScreen:preview.transport')} value="€96.50" />
            </View>

            {/* Flying drag ghost */}
            <Animated.View
                pointerEvents="none"
                style={[$box, $boxShadowStrong, $ghostBox, { opacity: flyOpacity, transform: [{ translateX }, { translateY }] }]}
            >
                <Text text={cash.charAt(0).toUpperCase()} style={themed($boxLetter)} />
            </Animated.View>
        </View>
    );
}
