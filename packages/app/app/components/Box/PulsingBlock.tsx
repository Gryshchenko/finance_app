import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    Easing,
} from 'react-native-reanimated';

interface PulsingBlockProps {
    active: boolean;
    width?: number;
    height?: number;
    children?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

const PulsingBlock: React.FC<PulsingBlockProps> = ({ active, style, children }) => {
    const scale = useSharedValue(1);

    useEffect(() => {
        if (active) {
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.1, {
                        duration: 500,
                        easing: Easing.inOut(Easing.ease),
                    }),
                    withTiming(1, {
                        duration: 500,
                        easing: Easing.inOut(Easing.ease),
                    }),
                ),
                -1, // infinite
                false,
            );
        } else {
            scale.value = withTiming(1);
        }
    }, [active]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
};

export default PulsingBlock;
