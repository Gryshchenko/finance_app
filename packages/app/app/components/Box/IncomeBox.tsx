import { useState } from 'react';
import { ViewStyle } from 'react-native';

import { ItemBox, ItemBoxProps, ItemType } from '@/components/Box/ItemBox';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

interface IncomeBoxProps extends Omit<ItemBoxProps, 'type' | 'isDroppable' | 'onDrop' | 'isActive' | 'setIsActive'> {}

export function IncomeBox({ title, value, icon, id, onDragStart, onDragging, onDragEnd, isDraggable, BoxProps }: IncomeBoxProps) {
    const droppableId = `${id}-${ItemType.Income}`;
    const { themed } = useAppTheme();
    const [isActive, setIsActive] = useState<boolean>(false);
    return (
        <ItemBox
            type={ItemType.Income}
            id={droppableId}
            title={title}
            icon={icon}
            value={value}
            isDroppable={false}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragging={onDragging}
            onDrop={() => null}
            isDraggable={isDraggable}
            isActive={isActive}
            setIsActive={setIsActive}
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
