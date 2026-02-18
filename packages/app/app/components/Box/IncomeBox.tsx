import { ViewStyle } from 'react-native';

import ItemBox, { ItemBoxProps, ItemType } from '@/components/Box/ItemBox';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

interface IncomeBoxProps extends Omit<ItemBoxProps, 'type' | 'isDroppable' | 'onDrop' | 'droppableId'> {}

export function IncomeBox({ title, value, icon, id, onDragStart, onDragEnd, isDraggable, BoxProps }: IncomeBoxProps) {
    const droppableId = `${id}-${ItemType.Income}`;
    const { themed } = useAppTheme();
    return (
        <ItemBox
            type={ItemType.Income}
            id={id}
            droppableId={droppableId}
            title={title}
            icon={icon}
            value={value}
            isDroppable={false}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDrop={() => null}
            isDraggable={isDraggable}
            BoxProps={{
                styles: {
                    box: themed($boxDefault),
                    container: BoxProps?.styles?.container,
                },
            }}
        />
    );
}
const $boxDefault: ThemedStyle<ViewStyle> = () => ({
    backgroundColor: 'rgba(41,128,185, 0.1)',
    color: 'rgba(41,128,185,0.1)',
});
