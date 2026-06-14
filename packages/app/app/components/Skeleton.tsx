import { useEffect } from 'react';
import { DimensionValue, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useAppTheme } from '@/theme/context';

type Props = {
    width?: DimensionValue;
    height?: DimensionValue;
    radius?: number;
    style?: ViewStyle;
};

/**
 * A single shimmering placeholder block (pulsing opacity). Compose several of these
 * to mock a component's layout while its data loads.
 */
export function Skeleton({ width = '100%', height = 16, radius = 8, style }: Props) {
    const { theme } = useAppTheme();
    const opacity = useSharedValue(0.4);

    useEffect(() => {
        opacity.value = withRepeat(withTiming(0.9, { duration: 800 }), -1, true);
    }, [opacity]);

    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <Animated.View
            style={[{ width, height, borderRadius: radius, backgroundColor: theme.colors.separator }, animatedStyle, style]}
        />
    );
}
