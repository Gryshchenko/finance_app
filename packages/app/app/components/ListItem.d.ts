import { ReactElement } from 'react';
import { StyleProp, TextStyle, TouchableOpacityProps, View, ViewStyle } from 'react-native';

import { IconTypes } from './Icon';
import { TextProps } from './Text';

export interface ListItemProps extends TouchableOpacityProps {
    /**
     * How tall the list item should be.
     * Default: 56
     */
    height?: number;
    /**
     * Whether to show the top separator.
     * Default: false
     */
    topSeparator?: boolean;
    /**
     * Whether to show the bottom separator.
     * Default: false
     */
    bottomSeparator?: boolean;
    /**
     * Text to display if not using `tx` or nested components.
     */
    text?: TextProps['text'];
    /**
     * Text which is looked up via i18n.
     */
    tx?: TextProps['tx'];
    /**
     * Children components.
     */
    children?: TextProps['children'];
    /**
     * Optional options to pass to i18n. Useful for interpolation
     * as well as explicitly setting locale or translation fallbacks.
     */
    txOptions?: TextProps['txOptions'];
    /**
     * Optional text style override.
     */
    textStyle?: StyleProp<TextStyle>;
    /**
     * Pass any additional props directly to the Text component.
     */
    TextProps?: TextProps;
    /**
     * Optional View container style override.
     */
    containerStyle?: StyleProp<ViewStyle>;
    /**
     * Optional TouchableOpacity style override.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * Icon that should appear on the left.
     */
    leftIcon?: IconTypes;
    /**
     * An optional tint color for the left icon
     */
    leftIconColor?: string;
    /**
     * Icon that should appear on the right.
     */
    rightIcon?: IconTypes;
    /**
     * An optional tint color for the right icon
     */
    rightIconColor?: string;
    /**
     * Right action custom ReactElement.
     * Overrides `rightIcon`.
     */
    RightComponent?: ReactElement;
    /**
     * Left action custom ReactElement.
     * Overrides `leftIcon`.
     */
    LeftComponent?: ReactElement;
}
/**
 * A styled row component that can be used in FlatList, SectionList, or by itself.
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/ListItem/}
 * @param {ListItemProps} props - The props for the `ListItem` component.
 * @returns {JSX.Element} The rendered `ListItem` component.
 */
export declare const ListItem: import('react').ForwardRefExoticComponent<ListItemProps & import('react').RefAttributes<View>>;
