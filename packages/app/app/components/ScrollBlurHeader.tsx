import { LayoutChangeEvent, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { useAppTheme } from '@/theme/context';
import { spacing } from '@/theme/spacing';
import { ThemedStyle } from '@/theme/types';

// Scroll distance over which the pinned header morphs from opaque to translucent-blur.
const SCROLL_FADE_DISTANCE = 40;

interface Props {
    // Live scroll offset of the list beneath the header.
    scrollY: SharedValue<number>;
    // Reports the measured height so the list can be padded down by exactly this much.
    onHeightChange?: (height: number) => void;
    // Negative side inset that cancels the screen container's horizontal padding so the
    // blur is full-bleed; the same value is re-applied as the inner content gutter.
    // Defaults to spacing.lg (the standard screen gutter).
    horizontalInset?: number;
    // Negative top inset that cancels the screen container's top padding so the blur
    // reaches the top of the content area.
    topInset?: number;
    // Top padding for the inner content (breathing room above the header). Defaults to
    // topInset; pass explicitly when the desired breathing room differs from the inset
    // that was cancelled (e.g. screens with large vertical padding).
    contentTopPadding?: number;
    children: React.ReactNode;
    childrenStyles?: ViewStyle;
}

/**
 * Pinned content (e.g. stats + a section label) that a list scrolls underneath. At the
 * top it is a solid opaque bar; as the list scrolls up, the solid layer fades out and a
 * blur + hairline separator fade in, so the rows show through frosted - the iOS large-
 * title nav bar behaviour, matching the dashboard header.
 */
export const ScrollBlurHeader: React.FC<Props> = ({
    scrollY,
    onHeightChange,
    horizontalInset = spacing.lg,
    topInset = 0,
    contentTopPadding,
    childrenStyles,
    children,
}) => {
    const { themed, theme, themeContext } = useAppTheme();
    const { colors } = theme;

    const onLayout = (e: LayoutChangeEvent) => onHeightChange?.(e.nativeEvent.layout.height);

    const $solidStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [0, SCROLL_FADE_DISTANCE], [1, 0], Extrapolation.CLAMP),
    }));
    const $blurStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [0, SCROLL_FADE_DISTANCE], [0, 1], Extrapolation.CLAMP),
    }));
    const $borderStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [0, SCROLL_FADE_DISTANCE], [0, 1], Extrapolation.CLAMP),
    }));

    return (
        <View style={[$overlay, { top: -topInset, left: -horizontalInset, right: -horizontalInset }]} onLayout={onLayout}>
            <Animated.View
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }, $solidStyle]}
            />
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, $blurStyle]}>
                <BlurView intensity={40} tint={themeContext === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            </Animated.View>
            <Animated.View pointerEvents="none" style={[themed($border), $borderStyle]} />

            <View style={[{ paddingHorizontal: horizontalInset, paddingTop: contentTopPadding ?? topInset }, childrenStyles]}>
                {children}
            </View>
        </View>
    );
};

// Absolutely positioned over the list; full-bleed via the negative insets applied inline.
const $overlay: ViewStyle = {
    position: 'absolute',
    zIndex: 10,
    overflow: 'hidden',
};

const $border: ThemedStyle<ViewStyle> = ({ colors }) => ({
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
});
