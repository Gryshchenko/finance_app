import { ReactElement } from 'react';
import { StyleProp, TextStyle, TouchableOpacityProps, ViewStyle } from 'react-native';

import { ExtendedEdge } from '@/utils/useSafeAreaInsetsStyle';

import { IconTypes } from './Icon';
import { TextProps } from './Text';

export interface HeaderProps {
    /**
     * The layout of the title relative to the action components.
     * - `center` will force the title to always be centered relative to the header. If the title or the action buttons are too long, the title will be cut off.
     * - `flex` will attempt to center the title relative to the action buttons. If the action buttons are different widths, the title will be off-center relative to the header.
     */
    titleMode?: 'center' | 'flex';
    /**
     * Optional title style override.
     */
    titleStyle?: StyleProp<TextStyle>;
    /**
     * Optional outer title container style override.
     */
    titleContainerStyle?: StyleProp<ViewStyle>;
    /**
     * Optional inner header wrapper style override.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * Optional outer header container style override.
     */
    containerStyle?: StyleProp<ViewStyle>;
    /**
     * Background color
     */
    backgroundColor?: string;
    /**
     * Title text to display if not using `tx` or nested components.
     */
    title?: TextProps['text'];
    /**
     * Title text which is looked up via i18n.
     */
    titleTx?: TextProps['tx'];
    /**
     * Optional options to pass to i18n. Useful for interpolation
     * as well as explicitly setting locale or translation fallbacks.
     */
    titleTxOptions?: TextProps['txOptions'];
    /**
     * Icon that should appear on the left.
     * Can be used with `onLeftPress`.
     */
    leftIcon?: IconTypes;
    /**
     * An optional tint color for the left icon
     */
    leftIconColor?: string;
    /**
     * Left action text to display if not using `leftTx`.
     * Can be used with `onLeftPress`. Overrides `leftIcon`.
     */
    leftText?: TextProps['text'];
    /**
     * Left action text text which is looked up via i18n.
     * Can be used with `onLeftPress`. Overrides `leftIcon`.
     */
    leftTx?: TextProps['tx'];
    /**
     * Left action custom ReactElement if the built in action props don't suffice.
     * Overrides `leftIcon`, `leftTx` and `leftText`.
     */
    LeftActionComponent?: ReactElement;
    /**
     * Optional options to pass to i18n. Useful for interpolation
     * as well as explicitly setting locale or translation fallbacks.
     */
    leftTxOptions?: TextProps['txOptions'];
    /**
     * What happens when you press the left icon or text action.
     */
    onLeftPress?: TouchableOpacityProps['onPress'];
    /**
     * Icon that should appear on the right.
     * Can be used with `onRightPress`.
     */
    rightIcon?: IconTypes;
    /**
     * An optional tint color for the right icon
     */
    rightIconColor?: string;
    /**
     * Right action text to display if not using `rightTx`.
     * Can be used with `onRightPress`. Overrides `rightIcon`.
     */
    rightText?: TextProps['text'];
    /**
     * Right action text text which is looked up via i18n.
     * Can be used with `onRightPress`. Overrides `rightIcon`.
     */
    rightTx?: TextProps['tx'];
    /**
     * Right action custom ReactElement if the built in action props don't suffice.
     * Overrides `rightIcon`, `rightTx` and `rightText`.
     */
    RightActionComponent?: ReactElement;
    /**
     * Optional options to pass to i18n. Useful for interpolation
     * as well as explicitly setting locale or translation fallbacks.
     */
    rightTxOptions?: TextProps['txOptions'];
    /**
     * What happens when you press the right icon or text action.
     */
    onRightPress?: TouchableOpacityProps['onPress'];
    /**
     * Override the default edges for the safe area.
     */
    safeAreaEdges?: ExtendedEdge[];
}
/**
 * Header that appears on many screens. Will hold navigation buttons and screen title.
 * The Header is meant to be used with the `screenOptions.header` option on navigators, routes, or screen components via `navigation.setOptions({ header })`.
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/Header/}
 * @param {HeaderProps} props - The props for the `Header` component.
 * @returns {JSX.Element} The rendered `Header` component.
 */
export declare function Header(props: HeaderProps): import('react').JSX.Element;
