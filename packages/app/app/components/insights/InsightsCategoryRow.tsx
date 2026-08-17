import { FC } from 'react';
import { TextStyle, View, ViewStyle } from 'react-native';
import { CategoryIconType } from '@tenpercent/shared';

import { CategoryIcon } from '@/components/CategoryIcon';
import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import { spacing } from '@/theme/spacing';
import { ThemedStyle } from '@/theme/types';

/** `new` - nothing spent here last period, `flat` - unchanged (or nothing to compare). */
export type DeltaKind = 'new' | 'up' | 'down' | 'flat';

interface IProps {
    name: string;
    icon: CategoryIconType;
    /** Pre-formatted amount, e.g. "$540.00". */
    amount: string;
    /** 0..1 - this category's share of the period's spending. */
    share: number;
    /** e.g. "NEW", "+4.2%", "-8.1%", or "…" while the comparison loads. */
    delta: string;
    deltaKind: DeltaKind;
    isLast: boolean;
}

/**
 * One category line: icon tile, name + amount on a single baseline, and a share
 * bar with the change against the comparison month underneath. Categories with
 * no spending this period are dimmed rather than hidden.
 */
export const InsightsCategoryRow: FC<IProps> = ({ name, icon, amount, share, delta, deltaKind, isLast }) => {
    const {
        themed,
        theme: { colors },
    } = useAppTheme();

    const active = share > 0;
    // The accent marks state, not money: spending more (and brand-new spending)
    // takes the tint, a drop is green, an untouched category stays neutral.
    const deltaColor = deltaKind === 'down' ? colors.palette.green400 : deltaKind === 'flat' ? colors.textDim : colors.tint;

    return (
        <View style={[themed($row), isLast && $rowLast]}>
            <View style={[themed($iconBox), active ? themed($iconBoxActive) : themed($iconBoxIdle)]}>
                <CategoryIcon name={icon} size={19} color={active ? colors.tint : colors.textDim} />
            </View>

            <View style={$content}>
                <View style={$titleRow}>
                    <Text text={name} numberOfLines={1} style={themed($name)} />
                    <Text text={amount} style={[themed($amount), !active && themed($amountIdle)]} numberOfLines={1} />
                </View>

                <View style={$metaRow}>
                    <View style={themed($track)}>
                        <View
                            style={[
                                $fill,
                                {
                                    // A hairline keeps empty categories legible as a row rather than a gap.
                                    width: `${Math.max(active ? share * 100 : 0, 2)}%`,
                                    backgroundColor: active ? colors.tint : colors.separator,
                                },
                            ]}
                        />
                    </View>
                    <Text text={delta} style={[themed($delta), { color: deltaColor }]} />
                </View>
            </View>
        </View>
    );
};

const $row: ThemedStyle<ViewStyle> = ({ colors }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
});

const $rowLast: ViewStyle = {
    borderBottomWidth: 0,
};

const $iconBox: ThemedStyle<ViewStyle> = ({ border }) => ({
    width: 36,
    height: 36,
    borderRadius: border.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
});

const $iconBoxActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
    backgroundColor: colors.palette.primary100,
});

const $iconBoxIdle: ThemedStyle<ViewStyle> = ({ colors }) => ({
    backgroundColor: colors.surfaceMuted,
});

const $content: ViewStyle = {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs - 2,
};

const $titleRow: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.xs,
};

const $name: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    flexShrink: 1,
    fontFamily: typography.primary.medium,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
});

const $amount: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontFamily: typography.fonts.funnelSans.bold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
});

const $amountIdle: ThemedStyle<TextStyle> = ({ colors }) => ({
    color: colors.textDim,
});

const $metaRow: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
};

const $track: ThemedStyle<ViewStyle> = ({ colors }) => ({
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
});

const $fill: ViewStyle = {
    height: '100%',
    borderRadius: 2,
};

const $delta: ThemedStyle<TextStyle> = ({ typography }) => ({
    fontFamily: typography.fonts.funnelSans.bold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.3,
});
