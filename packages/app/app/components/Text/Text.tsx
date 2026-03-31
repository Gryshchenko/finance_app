import { ReactNode, forwardRef, ForwardedRef } from 'react';
// eslint-disable-next-line no-restricted-imports
import { StyleProp, Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { TOptions } from 'i18next';

import { isRTL, TxKeyPath } from '@/i18n';
import { translate } from '@/i18n/translate';
import { useAppTheme } from '@/theme/context';

import { TextPresets, TextSizes, TextWeights, $presets, $sizeStyles, $fontWeightStyles } from './Text.presets';

export type { TextPresets, TextSizes, TextWeights };

export interface TextProps extends RNTextProps {
    /**
     * Text which is looked up via i18n.
     */
    tx?: TxKeyPath;
    /**
     * The text to display if not using `tx` or nested components.
     */
    text?: string;
    /**
     * Optional options to pass to i18n. Useful for interpolation
     * as well as explicitly setting locale or translation fallbacks.
     */
    txOptions?: TOptions;
    /**
     * An optional style override useful for padding & margin.
     */
    style?: StyleProp<TextStyle>;
    /**
     * One of the different types of text presets.
     */
    preset?: TextPresets;
    /**
     * Text weight modifier.
     */
    weight?: TextWeights;
    /**
     * Text size modifier.
     */
    size?: TextSizes;
    /**
     * Children components.
     */
    children?: ReactNode;
}

/**
 * For your text displaying needs.
 * This component is a HOC over the built-in React Native one.
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/Text/}
 * @param {TextProps} props - The props for the `Text` component.
 * @returns {JSX.Element} The rendered `Text` component.
 */
export const Text = forwardRef(function Text(props: TextProps, ref: ForwardedRef<RNText>) {
    const { weight, size, tx, txOptions, text, children, style: $styleOverride, ...rest } = props;
    const { themed } = useAppTheme();

    const i18nText = tx && translate(tx, txOptions);
    const content = i18nText || text || children;

    const preset: TextPresets = props.preset ?? 'default';
    const $styles: StyleProp<TextStyle> = [
        $rtlStyle,
        themed($presets[preset]),
        weight && $fontWeightStyles[weight],
        size && $sizeStyles[size],
        $styleOverride,
    ];

    return (
        <RNText {...rest} style={$styles} ref={ref}>
            {content}
        </RNText>
    );
});

const $rtlStyle: TextStyle = isRTL ? { writingDirection: 'rtl' } : {};
