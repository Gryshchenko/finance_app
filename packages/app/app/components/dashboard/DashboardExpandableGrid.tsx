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
        if (isOpened.current) return;
        isOpened.current = true;
        height.value = withSpring(MAX_HEIGHT, {
            damping: 15,
            stiffness: 150,
        });
    }, [MAX_HEIGHT, height]);

    const closeGrid = useCallback(() => {
        if (!isOpened.current) return;
        isOpened.current = false;
        height.value = withSpring(MIN_HEIGHT, {
            damping: 15,
            stiffness: 150,
        });
    }, [MIN_HEIGHT, height]);

    useEffect(() => {
        if (activeZones === `${id}-view`) {
            openGrid();
        } else {
            closeGrid();
        }
    }, [activeZones, id, openGrid, closeGrid]);

    useEffect(() => {
        const measureZones = () => {
            viewRef.current?.measureInWindow((x, y, width, heightElement) => {
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
            handleRef.current?.measureInWindow((x, y, width, heightElement) => {
                addZone({
                    id: `${id}-handle`,
                    measure: {
                        pageX: x,
                        pageY: y,
                        width: width || 100,
                        height: heightElement || 50,
                    },
                });
            });
        };

        // let layout finish
        setTimeout(measureZones, 0);
    }, [addZone, id]);

    const gesture = Gesture.Pan()
        .onUpdate((e) => {
            if (!showHandle) return;
            // When opened, only allow swipe up (negative translationY) to close
            if (isOpened.current && e.translationY > 0) return;
            // When closed, only allow swipe down (positive translationY) to open
            if (!isOpened.current && e.translationY < 0) return;

            const newHeight = (isOpened.current ? MAX_HEIGHT : MIN_HEIGHT) + e.translationY;

            height.value = clamp(newHeight, MIN_HEIGHT, MAX_HEIGHT);
        })
        .onEnd((e) => {
            if (!showHandle) return;
            const mid = (MIN_HEIGHT + MAX_HEIGHT) / 2;

            if (height.value > mid || e.velocityY > 300) {
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
