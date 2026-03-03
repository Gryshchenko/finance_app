import { useEffect, useRef, useCallback } from 'react';
import { View } from 'react-native';
import { ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, clamp } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useDragOverlay } from '@/components/dashboard/Box/DragOverlayContext';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

type Props = {
    rowHeight: number;
    rows: number;
    children: React.ReactNode;
    id: string;
};

export default function DashboardExpandableGrid({ rowHeight, rows, children, id }: Props) {
    const { themed } = useAppTheme();
    const { addZone, activeZones } = useDragOverlay();

    const MIN_HEIGHT = rowHeight;
    const MAX_HEIGHT = rowHeight * rows;
    const showHandle = rows >= 2;

    const viewRef = useRef<View>(null);
    const handleRef = useRef<View>(null);
    const isOpened = useRef(false);
    const height = useSharedValue(MIN_HEIGHT);

    const openGrid = useCallback(() => {
        if (height.value !== MIN_HEIGHT) return;
        height.value = withSpring(
            MAX_HEIGHT,
            {
                damping: 15,
                stiffness: 150,
            },
            (finished) => {
                if (finished) {
                    // Optional cleanup logic here
                }
            },
        );
    }, [MAX_HEIGHT, MIN_HEIGHT, height]);

    const closeGrid = useCallback(() => {
        if (height.value !== MAX_HEIGHT) return;
        height.value = withSpring(
            MIN_HEIGHT,
            {
                damping: 15,
                stiffness: 150,
            },
            (finished) => {
                if (finished) {
                    // Optional cleanup logic here
                }
            },
        );
    }, [MAX_HEIGHT, MIN_HEIGHT, height]);

    useEffect(() => {
        if (activeZones === `${id}-view`) {
            openGrid();
        } else {
            closeGrid();
        }
    }, [activeZones, id, openGrid, closeGrid]);

    useEffect(() => {
        const measureZones = () => {
            viewRef.current?.measure((x, y, width, heightElement) => {
                addZone({
                    id: `${id}-view`,
                    measure: {
                        pageX: x,
                        pageY: y,
                        width,
                        height: heightElement,
                    },
                });
            });
            handleRef.current?.measure((x, y) => {
                addZone({
                    id: `${id}-handle`,
                    measure: {
                        pageX: x,
                        pageY: y,
                        width: 100,
                        height: 50,
                    },
                });
            });
        };

        // let layout finish
        setTimeout(measureZones, 0);
        return () => {};
    }, []);

    const gesture = Gesture.Pan()
        .onUpdate((e) => {
            if (!showHandle) return;
            if (isOpened && e.translationY < 0) return;

            if (!isOpened && e.translationY > 0) return;

            const newHeight = MIN_HEIGHT - e.translationY;

            height.value = clamp(newHeight, MIN_HEIGHT, MAX_HEIGHT);
        })
        .onEnd((e) => {
            if (!showHandle) return;
            const mid = (MIN_HEIGHT + MAX_HEIGHT) / 2;

            if (height.value > mid || e.velocityY < -300) {
                scheduleOnRN(openGrid);
            } else {
                scheduleOnRN(closeGrid);
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        height: height.value,
    }));
    return (
        <View ref={viewRef} style={themed($wrapper)}>
            <GestureDetector gesture={gesture}>
                <Animated.View style={[themed($container), animatedStyle]}>
                    <View style={themed($content)}>{children}</View>
                    {showHandle && <View ref={handleRef} style={themed($handle)} />}
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

export const $wrapper: ThemedStyle<ViewStyle> = () => ({
    alignItems: 'center',
    width: '100%',
});

export const $container: ThemedStyle<ViewStyle> = ({ border, colors }) => ({
    width: '100%',
    paddingTop: 10,
    borderRadius: border.borderRadius,
    borderColor: colors.border,
    borderWidth: border.borderWidth,
    backgroundColor: '#fff',
    overflow: 'hidden',
});

export const $handle: ThemedStyle<ViewStyle> = ({ colors, border }) => ({
    width: 40,
    height: 4,
    borderRadius: border.borderRadius,
    backgroundColor: colors.palette.neutral300,
    alignSelf: 'center',
    marginVertical: 8,
    position: 'absolute',
    bottom: 0,
});

export const $content: ThemedStyle<ViewStyle> = () => ({
    overflow: 'hidden',
});
