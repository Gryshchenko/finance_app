import { StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { useAppTheme } from '@/theme/context';
import { spacing } from '@/theme/spacing';

// Height of the frosted strip at a scroll edge.
export const SCROLL_EDGE_BLUR_HEIGHT = 28;

interface Props {
    edge: 'top' | 'bottom';
    // 0..1 opacity driver. Typically derived from scroll position: the top edge fades
    // in once scrolled away from the top, the bottom edge fades out at the very end.
    progress: SharedValue<number>;
    height?: number;
}

/**
 * A frosted strip pinned to the top or bottom edge of a scrolling view. Content dissolves
 * into a gradient as it approaches the edge instead of ending on a hard cut. Driven by an
 * opacity `progress` so it only shows while there is content to scroll past. Non-interactive.
 */
export const ScrollEdgeBlur: React.FC<Props> = ({ edge, progress, height = SCROLL_EDGE_BLUR_HEIGHT }) => {
    const { themeContext, theme } = useAppTheme();
    const { colors } = theme;

    // Opaque at the outer edge, dissolving toward the content. `${bg}00` is the background
    // colour at zero alpha, keeping the fade neutral.
    const direction = edge === 'top' ? 'to bottom' : 'to top';
    const gradient = `linear-gradient(${direction}, ${colors.background} 0%, ${colors.background}00 100%)`;

    const $style = useAnimatedStyle(() => ({ opacity: progress.value }));

    return (
        <Animated.View pointerEvents="none" style={[$edge, edge === 'top' ? $top : $bottom, { height }, $style]}>
            <BlurView intensity={25} tint={themeContext === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { experimental_backgroundImage: gradient }]} />
        </Animated.View>
    );
};

// Full-bleed: negative horizontal insets cancel the screen container's padding.
const $edge: ViewStyle = {
    position: 'absolute',
    left: -spacing.lg,
    right: -spacing.lg,
    zIndex: 10,
    overflow: 'hidden',
};

const $top: ViewStyle = { top: 0 };
const $bottom: ViewStyle = { bottom: 0 };
