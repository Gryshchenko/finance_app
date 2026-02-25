import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, clamp, useAnimatedRef } from 'react-native-reanimated';
import { Droppable } from 'react-native-reanimated-dnd';
import { scheduleOnRN } from 'react-native-worklets';

import { useDragOverlay } from '@/components/Box/DragOverlayContext';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

type Props = {
    rowHeight: number;
    rows: number;
    children: React.ReactNode;
    id: string;
};

const ANIMATION_TIMEOUT_MS = 200; // Watchdog timeout - should be longer than animation duration

export default function DashboardExpandableGrid({ rowHeight, rows, children, id }: Props) {
    const { themed } = useAppTheme();
    const { setExtendedGrid, addZone } = useDragOverlay();
    const viewRef = useRef<View>(null);
    const handleRef = useRef<View>(null);
    const MIN_HEIGHT = rowHeight;
    const MAX_HEIGHT = rowHeight * rows;
    const showHandle = rows >= 2;

    const height = useSharedValue(MIN_HEIGHT);
    const isOpened = useSharedValue(false);
    const animationTimeoutRef = useRef<number | null>(null);

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
                    onEnter: () => {
                        height.value = withSpring(
                            MAX_HEIGHT,
                            {
                                damping: 15,
                                stiffness: 150,
                            },
                            (finished) => {
                                if (finished) {
                                    scheduleOnRN(setExtendedGridWithWatchdog, true);
                                }
                            },
                        );
                        isOpened.value = true;
                    },
                    onLeave: () => {
                        isOpened.value = true;
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
        return () => {
            clearAnimationTimeout();
        };
    }, []);

    const clearAnimationTimeout = () => {
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
            animationTimeoutRef.current = null;
        }
    };

    const setExtendedGridWithWatchdog = (isExtended: boolean) => {
        clearAnimationTimeout();
        setExtendedGrid((prev) => ({ ...prev, [id]: { isOpen: isExtended } }));
    };

    const setExtendedGridWithTimeout = (isExtended: boolean) => {
        clearAnimationTimeout();
        // Set watchdog timeout as fallback
        animationTimeoutRef.current = setTimeout(() => {
            setExtendedGridWithWatchdog(isExtended);
        }, ANIMATION_TIMEOUT_MS);
    };

    const gesture = Gesture.Pan()
        .onUpdate((e) => {
            if (!showHandle) return;
            if (isOpened.value && e.translationY < 0) return;

            if (!isOpened.value && e.translationY > 0) return;
            const newHeight = MIN_HEIGHT - e.translationY;
            height.value = clamp(newHeight, MIN_HEIGHT, MAX_HEIGHT);
        })
        .onEnd((e) => {
            if (!showHandle) return;
            const mid = (MIN_HEIGHT + MAX_HEIGHT) / 2;

            if (height.value > mid || e.velocityY < -300) {
                scheduleOnRN(setExtendedGridWithTimeout, true);
                height.value = withSpring(
                    MAX_HEIGHT,
                    {
                        damping: 15,
                        stiffness: 150,
                    },
                    (finished) => {
                        if (finished) {
                            scheduleOnRN(setExtendedGridWithWatchdog, true);
                        }
                    },
                );
                isOpened.value = true;
            } else {
                scheduleOnRN(setExtendedGridWithTimeout, false);
                height.value = withSpring(
                    MIN_HEIGHT,
                    {
                        damping: 15,
                        stiffness: 150,
                    },
                    (finished) => {
                        if (finished) {
                            scheduleOnRN(setExtendedGridWithWatchdog, false);
                        }
                    },
                );
                isOpened.value = false;
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

export const $container: ThemedStyle<ViewStyle> = () => ({
    width: '100%',
    paddingTop: 10,
    borderRadius: 0,
    backgroundColor: '#fff',
    overflow: 'hidden',
});

export const $handle: ThemedStyle<ViewStyle> = ({ colors }) => ({
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.palette.neutral300,
    alignSelf: 'center',
    marginVertical: 8,
    position: 'absolute',
    bottom: 0,
});

export const $content: ThemedStyle<ViewStyle> = () => ({
    overflow: 'hidden',
});
