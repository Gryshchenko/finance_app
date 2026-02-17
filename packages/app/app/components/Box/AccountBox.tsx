import { ViewStyle } from 'react-native';

import { ItemBox, ItemBoxProps, ItemType } from '@/components/Box/ItemBox';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

interface AccountBoxProps extends Omit<ItemBoxProps, 'type' | 'isDragging' | 'setIsDragging' | 'droppableId'> {}

export function AccountBox({
    title,
    value,
    icon,
    id,
    isDroppable,
    onDragStart,
    onDragging,
    onDragEnd,
    onDrop,
    isDraggable,
    BoxProps,
}: AccountBoxProps) {
    const droppableId = `${id}-${ItemType.Account}`;
    const { themed } = useAppTheme();
    return (
        <ItemBox
            type={ItemType.Account}
            id={id}
            droppableId={droppableId}
            title={title}
            icon={icon}
            value={value}
            isDroppable={isDroppable}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragging={onDragging}
            onDrop={onDrop}
            isDraggable={isDraggable}
            BoxProps={{
                text: title?.[0],
                styles: {
                    box: themed($boxDefault),
                    container: BoxProps?.styles?.container,
                },
            }}
        />
    );
}
const $boxDefault: ThemedStyle<ViewStyle> = () => ({
    backgroundColor: 'rgba(26, 26, 26, 1)',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    color: 'rgba(255, 255, 255, 1)',
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
    padding: 16,
});
