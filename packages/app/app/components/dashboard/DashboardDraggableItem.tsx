import { View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useDragOverlay } from '@/components/dashboard/Box/DragOverlayContext';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

export default function DashboardDraggableItem() {
    const { themed } = useAppTheme();
    const { draggedElement, draggedElementStyle } = useDragOverlay();
    if (draggedElement) {
        return (
            <View style={themed($item)} pointerEvents="none">
                <Animated.View style={draggedElementStyle}>{draggedElement}</Animated.View>
            </View>
        );
    }
    return null;
}

export const $item: ThemedStyle<ViewStyle> = () => ({
    position: 'absolute',
    zIndex: 100,
    opacity: 0.6,
});
