import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

export default function PendingDots({ size = 12, color = '#333', gap = 8, dotScale = 1.5, speed = 400 }) {
    const a1 = useRef(new Animated.Value(0)).current;
    const a2 = useRef(new Animated.Value(0)).current;
    const a3 = useRef(new Animated.Value(0)).current;
    const anims = [a1, a2, a3];
    useEffect(() => {
        const loops = anims.map((anim, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(i * (speed / 3)),
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: speed,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: speed,
                        useNativeDriver: true,
                    }),
                ]),
            ),
        );
        Animated.stagger(0, loops).start();
        return () => {
            loops.forEach((l) => l.stop && l.stop());
        };
    }, [a1, a2, a3, speed]); // eslint-disable-line
    const renderDot = (anim, idx) => {
        const scale = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, dotScale],
        });
        const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -6],
        });
        const opacity = anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.6, 1, 0.6],
        });
        return (
            <Animated.View
                key={idx}
                style={[
                    styles.dot,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        marginHorizontal: gap / 2,
                        backgroundColor: color,
                        transform: [{ translateY }, { scale }],
                        opacity,
                    },
                ]}
            />
        );
    };
    return (
        <View style={styles.row}>
            {renderDot(a1, 0)}
            {renderDot(a2, 1)}
            {renderDot(a3, 2)}
        </View>
    );
}
const styles = StyleSheet.create({
    dot: {},
    row: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
});
