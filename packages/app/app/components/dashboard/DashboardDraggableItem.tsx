import { View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useDragOverlay } from '@/components/Box/DragOverlayContext';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

export default function DashboardDraggableItem() {
    const { themed } = useAppTheme();
    const { element, animatedStyle } = useDragOverlay();
    if (element) {
        return (
            <View style={themed($item)} pointerEvents="none">
                <Animated.View style={animatedStyle}>{element}</Animated.View>
            </View>
        );
    }
    return null;
}

export const $item: ThemedStyle<ViewStyle> = () => ({
    position: 'absolute',
    zIndex: 9999,
});
