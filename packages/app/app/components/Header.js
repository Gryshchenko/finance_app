import { TouchableOpacity, View } from 'react-native';
import { isRTL } from '@/i18n';
import { translate } from '@/i18n/translate';
import { useAppTheme } from '@/theme/context';
import { $styles } from '@/theme/styles';
import { useSafeAreaInsetsStyle } from '@/utils/useSafeAreaInsetsStyle';
import { PressableIcon } from './Icon';
import { Text } from './Text';
/**
 * Header that appears on many screens. Will hold navigation buttons and screen title.
 * The Header is meant to be used with the `screenOptions.header` option on navigators, routes, or screen components via `navigation.setOptions({ header })`.
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/Header/}
 * @param {HeaderProps} props - The props for the `Header` component.
 * @returns {JSX.Element} The rendered `Header` component.
 */
export function Header(props) {
    const {
        theme: { colors },
        themed,
    } = useAppTheme();
    const {
        backgroundColor = colors.background,
        LeftActionComponent,
        leftIcon,
        leftIconColor,
        leftText,
        leftTx,
        leftTxOptions,
        onLeftPress,
        onRightPress,
        RightActionComponent,
        rightIcon,
        rightIconColor,
        rightText,
        rightTx,
        rightTxOptions,
        safeAreaEdges = ['top'],
        title,
        titleMode = 'center',
        titleTx,
        titleTxOptions,
        titleContainerStyle: $titleContainerStyleOverride,
        style: $styleOverride,
        titleStyle: $titleStyleOverride,
        containerStyle: $containerStyleOverride,
    } = props;
    const $containerInsets = useSafeAreaInsetsStyle(safeAreaEdges);
    const titleContent = titleTx ? translate(titleTx, titleTxOptions) : title;
    return (
        <View style={[$container, $containerInsets, { backgroundColor }, $containerStyleOverride]}>
            <View style={[$styles.row, $wrapper, $styleOverride]}>
                <HeaderAction
                    tx={leftTx}
                    text={leftText}
                    icon={leftIcon}
                    iconColor={leftIconColor}
                    onPress={onLeftPress}
                    txOptions={leftTxOptions}
                    backgroundColor={backgroundColor}
                    ActionComponent={LeftActionComponent}
                />

                {!!titleContent && (
                    <View
                        style={[
                            $titleWrapperPointerEvents,
                            titleMode === 'center' && themed($titleWrapperCenter),
                            titleMode === 'flex' && $titleWrapperFlex,
                            $titleContainerStyleOverride,
                        ]}
                    >
                        <Text weight="medium" size="md" text={titleContent} style={[$title, $titleStyleOverride]} />
                    </View>
                )}

                <HeaderAction
                    tx={rightTx}
                    text={rightText}
                    icon={rightIcon}
                    iconColor={rightIconColor}
                    onPress={onRightPress}
                    txOptions={rightTxOptions}
                    backgroundColor={backgroundColor}
                    ActionComponent={RightActionComponent}
                />
            </View>
        </View>
    );
}
/**
 * @param {HeaderActionProps} props - The props for the `HeaderAction` component.
 * @returns {JSX.Element} The rendered `HeaderAction` component.
 */
function HeaderAction(props) {
    const { backgroundColor, icon, text, tx, txOptions, onPress, ActionComponent, iconColor } = props;
    const { themed } = useAppTheme();
    const content = tx ? translate(tx, txOptions) : text;
    if (ActionComponent) return ActionComponent;
    if (content) {
        return (
            <TouchableOpacity
                style={themed([$actionTextContainer, { backgroundColor }])}
                onPress={onPress}
                disabled={!onPress}
                activeOpacity={0.8}
            >
                <Text weight="medium" size="md" text={content} style={themed($actionText)} />
            </TouchableOpacity>
        );
    }
    if (icon) {
        return (
            <PressableIcon
                size={24}
                icon={icon}
                color={iconColor}
                onPress={onPress}
                containerStyle={themed([$actionIconContainer, { backgroundColor }])}
                style={isRTL ? { transform: [{ rotate: '180deg' }] } : {}}
            />
        );
    }
    return <View style={[$actionFillerContainer, { backgroundColor }]} />;
}
const $wrapper = {
    height: 56,
    alignItems: 'center',
    justifyContent: 'space-between',
};
const $container = {
    width: '100%',
};
const $title = {
    textAlign: 'center',
};
const $actionTextContainer = ({ spacing }) => ({
    flexGrow: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: spacing.md,
    zIndex: 2,
});
const $actionText = ({ colors }) => ({
    color: colors.tint,
});
const $actionIconContainer = ({ spacing }) => ({
    flexGrow: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: spacing.md,
    zIndex: 2,
});
const $actionFillerContainer = {
    width: 16,
};
const $titleWrapperPointerEvents = {
    pointerEvents: 'none',
};
const $titleWrapperCenter = ({ spacing }) => ({
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    position: 'absolute',
    paddingHorizontal: spacing.xxl,
    zIndex: 1,
});
const $titleWrapperFlex = {
    justifyContent: 'center',
    flexGrow: 1,
};
