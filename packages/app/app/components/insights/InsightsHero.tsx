import { FC } from 'react';
import { TextStyle, View, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import { spacing } from '@/theme/spacing';
import { ThemedStyle } from '@/theme/types';

interface IProps {
    /** Small uppercase line above the balance, e.g. "August 2026 - all accounts". */
    kicker: string;
    /** Pre-formatted balance split at the decimal separator: ['$3,140', '.00']. */
    balance: [string, string];
    /** Pre-formatted money strings. */
    income: string;
    spent: string;
    /** Signed percent, e.g. "+6.8%"; `undefined` while the comparison loads, `null` when there is nothing to compare with. */
    trend: string | undefined | null;
    trendUp: boolean;
    /** Explains what the bar shows, e.g. "vs June 2026 net flow". */
    trendNote: string;
    /** 0..1 - the share of this month's income that is already spent. */
    spentRatio: number;
    /** Right-hand caption under the bar, e.g. "62% spent". */
    spentLabel: string;
}

export const InsightsHero: FC<IProps> = ({
    kicker,
    balance,
    income,
    spent,
    trend,
    trendUp,
    trendNote,
    spentRatio,
    spentLabel,
}) => {
    const {
        themed,
        theme: { colors },
    } = useAppTheme();

    const trendColor = trendUp ? colors.hero.positive : colors.hero.negative;
    const trendBackground = trendUp ? colors.hero.positiveBackground : colors.hero.negativeBackground;
    // The bar is a two-segment flex row, so the ratio is enough - no width measuring needed.
    const spentFlex = Math.min(Math.max(spentRatio, 0), 1);

    return (
        <View style={themed($hero)}>
            <View style={$topRow}>
                <Text text={kicker} style={themed($kicker)} numberOfLines={1} />
                <View style={[themed($trendBadge), { backgroundColor: trendBackground }]}>
                    <MaterialIcons name={trendUp ? 'trending-up' : 'trending-down'} size={12} color={trendColor} />
                    <Text text={trend ?? '—'} style={[themed($trendText), { color: trendColor }]} />
                </View>
            </View>

            <View>
                <Text tx={'insights:totalBalance'} style={themed($label)} />
                <View style={$baseline}>
                    <Text text={balance[0]} style={themed($balanceMain)} adjustsFontSizeToFit numberOfLines={1} />
                    <Text text={balance[1]} style={themed($balanceCents)} />
                </View>
            </View>

            <View style={$statRow}>
                <View style={themed($statCell)}>
                    <Text tx={'common:income'} style={themed($statLabel)} />
                    <Text text={income} style={themed($statIncome)} numberOfLines={1} adjustsFontSizeToFit />
                </View>
                <View style={themed($statCell)}>
                    <Text tx={'insights:spent'} style={themed($statLabel)} numberOfLines={1} />
                    <Text text={spent} style={themed($statSpent)} numberOfLines={1} adjustsFontSizeToFit />
                </View>
            </View>

            <View>
                <View style={themed($bar)}>
                    <View style={[$barSegment, { flex: 1 - spentFlex, backgroundColor: colors.hero.positive }]} />
                    <View style={[$barSegment, { flex: spentFlex, backgroundColor: colors.tint }]} />
                </View>
                <View style={$barFooter}>
                    <Text text={trendNote} style={themed($barNote)} numberOfLines={1} />
                    <Text text={spentLabel} style={themed($barPercent)} />
                </View>
            </View>
        </View>
    );
};

const $hero: ThemedStyle<ViewStyle> = ({ colors, border }) => ({
    backgroundColor: colors.hero.background,
    borderRadius: border.borderRadius,
    padding: spacing.md,
    gap: spacing.md,
});

const $topRow: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
};

const $kicker: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    flexShrink: 1,
    fontFamily: typography.fonts.funnelSans.medium,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.tint,
});

const $trendBadge: ThemedStyle<ViewStyle> = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: spacing.xxs,
    borderRadius: 40,
});

const $trendText: ThemedStyle<TextStyle> = ({ typography }) => ({
    fontFamily: typography.fonts.funnelSans.bold,
    fontSize: 11,
    lineHeight: 15,
});

const $label: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontFamily: typography.fonts.funnelSans.medium,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.hero.label,
    marginBottom: spacing.xxs,
});

const $baseline: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'baseline',
};

const $balanceMain: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    flexShrink: 1,
    fontFamily: typography.fonts.funnelSans.bold,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -1,
    color: colors.hero.text,
});

const $balanceCents: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontFamily: typography.fonts.funnelSans.bold,
    fontSize: 22,
    color: colors.hero.textDim,
    marginLeft: 2,
});

const $statRow: ViewStyle = {
    flexDirection: 'row',
    gap: spacing.xs,
};

const $statCell: ThemedStyle<ViewStyle> = ({ colors, border }) => ({
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: border.borderRadius,
    backgroundColor: colors.hero.surface,
});

const $statLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontFamily: typography.fonts.funnelSans.medium,
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.hero.label,
    marginBottom: spacing.xxs,
});

const $statIncome: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontFamily: typography.fonts.funnelSans.bold,
    fontSize: 17,
    lineHeight: 23,
    color: colors.hero.positive,
});

const $statSpent: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontFamily: typography.fonts.funnelSans.bold,
    fontSize: 17,
    lineHeight: 23,
    color: colors.hero.text,
});

const $bar: ThemedStyle<ViewStyle> = ({ colors }) => ({
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: colors.hero.track,
});

const $barSegment: ViewStyle = {
    height: '100%',
};

const $barFooter: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginTop: spacing.xs,
};

const $barNote: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    flexShrink: 1,
    fontFamily: typography.primary.normal,
    fontSize: 11,
    lineHeight: 15,
    color: colors.hero.textDim,
});

const $barPercent: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontFamily: typography.fonts.funnelSans.bold,
    fontSize: 11,
    lineHeight: 15,
    color: colors.tint,
});
