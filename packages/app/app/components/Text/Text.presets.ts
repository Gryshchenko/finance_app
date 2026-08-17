import { TextStyle } from 'react-native';

import type { ThemedStyle, ThemedStyleArray } from '@/theme/types';
import { typography } from '@/theme/typography';

export type TextPresets = 'default' | 'bold' | 'heading' | 'subheading' | 'formLabel' | 'formHelper' | 'kicker';

export type TextSizes = keyof typeof $sizeStyles;
export type TextWeights = keyof typeof typography.primary;

export const $sizeStyles = {
    xxl: { fontSize: 36, lineHeight: 44 } satisfies TextStyle,
    xl: { fontSize: 24, lineHeight: 34 } satisfies TextStyle,
    lg: { fontSize: 20, lineHeight: 32 } satisfies TextStyle,
    md: { fontSize: 18, lineHeight: 26 } satisfies TextStyle,
    sm: { fontSize: 16, lineHeight: 24 } satisfies TextStyle,
    xs: { fontSize: 14, lineHeight: 21 } satisfies TextStyle,
    xxs: { fontSize: 12, lineHeight: 18 } satisfies TextStyle,
};

export const $fontWeightStyles = Object.entries(typography.primary).reduce(
    (acc, [weight, fontFamily]) => ({ ...acc, [weight]: { fontFamily } }),
    {},
) as Record<TextWeights, TextStyle>;

const $baseStyle: ThemedStyle<TextStyle> = (theme) => ({
    ...$sizeStyles.sm,
    ...$fontWeightStyles.normal,
    color: theme.colors.text,
});

export const $presets: Record<TextPresets, ThemedStyleArray<TextStyle>> = {
    default: [$baseStyle],
    bold: [$baseStyle, { ...$fontWeightStyles.bold }],
    heading: [
        $baseStyle,
        {
            ...$sizeStyles.xxl,
            ...$fontWeightStyles.bold,
        },
    ],
    subheading: [$baseStyle, { ...$sizeStyles.lg, ...$fontWeightStyles.medium }],
    formLabel: [$baseStyle, { ...$fontWeightStyles.medium }],
    formHelper: [$baseStyle, { ...$sizeStyles.sm, ...$fontWeightStyles.normal }],
    /** Small uppercase accent label above a screen/section title. */
    kicker: [
        $baseStyle,
        { ...$sizeStyles.xxs, ...$fontWeightStyles.medium, letterSpacing: 1.4, textTransform: 'uppercase' },
        ({ colors }) => ({ color: colors.tint }),
    ],
};
