import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ImageStyle, TextStyle, View, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

const logo = require('@assets/images/TenPercent-foreground-432.png');

const SIZE = 260;
const R = 120;
const CIRC = 2 * Math.PI * R; // 753.98
const TARGET = 0.1; // 10%

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Welcome slide for the onboarding tutorial.
 * A terracotta ring around the TenPercent logo fills to exactly 10% while a
 * badge counts 0 → 10%, conveying the app's core idea: set aside 10% of income.
 * Loops. Mirrors the approved design (Onboarding Tutorial.dc.html, slide 1).
 */
export function TutorialWelcomeSlide() {
    const {
        themed,
        theme: { colors },
    } = useAppTheme();

    const ring = useRef(new Animated.Value(0)).current; // 0 → 1 of TARGET fill
    const float = useRef(new Animated.Value(0)).current;
    const [pct, setPct] = useState(0);

    useEffect(() => {
        // Ring fill: hold at 10%, reset, loop.
        const ringLoop = Animated.loop(
            Animated.sequence([
                Animated.delay(400),
                Animated.timing(ring, { toValue: 1, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.delay(700),
                Animated.timing(ring, { toValue: 0, duration: 0, useNativeDriver: true }),
            ]),
        );
        ringLoop.start();

        // Gentle float.
        const floatLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(float, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                Animated.timing(float, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            ]),
        );
        floatLoop.start();

        // Count-up 0 → 10, synced with the ring loop (~2.3s cycle).
        const runCount = () => {
            let v = 0;
            const id = setInterval(() => {
                v += 1;
                setPct(v);
                if (v >= 10) clearInterval(id);
            }, 90);
            return id;
        };
        let inner = 0;
        const start = setTimeout(() => {
            inner = runCount();
        }, 500);
        const loop = setInterval(() => {
            clearInterval(inner);
            inner = runCount();
        }, 2300);

        return () => {
            ringLoop.stop();
            floatLoop.stop();
            clearTimeout(start);
            clearInterval(loop);
            clearInterval(inner);
        };
    }, [ring, float]);

    const dashoffset = ring.interpolate({ inputRange: [0, 1], outputRange: [CIRC, CIRC * (1 - TARGET)] });
    const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

    return (
        <View style={$wrap}>
            <View style={themed($glow)} />
            <Svg width={SIZE} height={SIZE} style={$svg}>
                <Circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={R}
                    fill="none"
                    stroke={colors.palette.neutral300}
                    strokeWidth={6}
                    strokeOpacity={0.5}
                />
                <AnimatedCircle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={R}
                    fill="none"
                    stroke={colors.tint}
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={dashoffset}
                    rotation={-90}
                    origin={`${SIZE / 2}, ${SIZE / 2}`}
                />
            </Svg>
            <Animated.Image source={logo} resizeMode="contain" style={[$logo, { transform: [{ translateY }] }]} />
            <View style={themed($badge)}>
                <Text text={String(pct)} style={themed($badgeNum)} />
                <Text text="%" style={themed($badgePct)} />
            </View>
        </View>
    );
}

const $wrap: ViewStyle = { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' };
const $svg: ViewStyle = { position: 'absolute', top: 0, left: 0 };
const $glow: ThemedStyle<ViewStyle> = ({ colors }) => ({
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.tint,
    opacity: 0.12,
});
const $logo: ImageStyle = { width: 200, height: 200 };
const $badge: ThemedStyle<ViewStyle> = ({ colors }) => ({
    position: 'absolute',
    bottom: 6,
    right: 6,
    minWidth: 62,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.palette.neutral800,
    borderRadius: 40,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
});
const $badgeNum: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontFamily: typography.fonts.funnelSans.bold,
    fontSize: 20,
    color: colors.palette.neutral100,
    letterSpacing: -0.5,
});
const $badgePct: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontFamily: typography.fonts.funnelSans.bold,
    fontSize: 13,
    color: colors.tint,
    marginLeft: 1,
});
