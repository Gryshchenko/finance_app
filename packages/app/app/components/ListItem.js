import { forwardRef } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '@/theme/context';
import { $styles } from '@/theme/styles';

import { Icon } from './Icon';
import { Text } from './Text';
/**
 * A styled row component that can be used in FlatList, SectionList, or by itself.
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/ListItem/}
 * @param {ListItemProps} props - The props for the `ListItem` component.
 * @returns {JSX.Element} The rendered `ListItem` component.
 */
export const ListItem = forwardRef(function ListItem(props, ref) {
    const {
        bottomSeparator,
        children,
        height = 56,
        LeftComponent,
        leftIcon,
        leftIconColor,
        RightComponent,
        rightIcon,
        rightIconColor,
        style,
        text,
        TextProps,
        topSeparator,
        tx,
        txOptions,
        textStyle: $textStyleOverride,
        containerStyle: $containerStyleOverride,
        ...TouchableOpacityProps
    } = props;
    const { themed } = useAppTheme();
    const isTouchable =
        TouchableOpacityProps.onPress !== undefined ||
        TouchableOpacityProps.onPressIn !== undefined ||
        TouchableOpacityProps.onPressOut !== undefined ||
        TouchableOpacityProps.onLongPress !== undefined;
    const $textStyles = [$textStyle, $textStyleOverride, TextProps?.style];
    const $containerStyles = [topSeparator && $separatorTop, bottomSeparator && $separatorBottom, $containerStyleOverride];
    const $touchableStyles = [$styles.row, $touchableStyle, { minHeight: height }, style];
    const Wrapper = isTouchable ? TouchableOpacity : View;
    return (
        <View ref={ref} style={themed($containerStyles)}>
            <Wrapper {...TouchableOpacityProps} style={$touchableStyles}>
                <ListItemAction side="left" size={height} icon={leftIcon} iconColor={leftIconColor} Component={LeftComponent} />

                <Text {...TextProps} tx={tx} text={text} txOptions={txOptions} style={themed($textStyles)}>
                    {children}
                </Text>

                <ListItemAction
                    side="right"
                    size={height}
                    icon={rightIcon}
                    iconColor={rightIconColor}
                    Component={RightComponent}
                />
            </Wrapper>
        </View>
    );
});
/**
 * @param {ListItemActionProps} props - The props for the `ListItemAction` component.
 * @returns {JSX.Element | null} The rendered `ListItemAction` component.
 */
function ListItemAction(props) {
    const { icon, Component, iconColor, size, side } = props;
    const { themed } = useAppTheme();
    const $iconContainerStyles = [$iconContainer];
    if (Component) return Component;
    if (icon !== undefined) {
        return (
            <Icon
                size={24}
                icon={icon}
                color={iconColor}
                containerStyle={themed([
                    $iconContainerStyles,
                    side === 'left' && $iconContainerLeft,
                    side === 'right' && $iconContainerRight,
                    { height: size },
                ])}
            />
        );
    }
    return null;
}
const $separatorTop = ({ colors }) => ({
    borderTopWidth: 1,
    borderTopColor: colors.separator,
});
const $separatorBottom = ({ colors }) => ({
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
});
const $textStyle = ({ spacing }) => ({
    paddingVertical: spacing.xs,
    alignSelf: 'center',
    flexGrow: 1,
    flexShrink: 1,
});
const $touchableStyle = {
    alignItems: 'flex-start',
};
const $iconContainer = {
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 0,
};
const $iconContainerLeft = ({ spacing }) => ({
    marginEnd: spacing.md,
});
const $iconContainerRight = ({ spacing }) => ({
    marginStart: spacing.md,
});
