import { ViewStyle } from 'react-native';
import { CategoryIconType } from '@tenpercent/shared';

import ItemBox, { ItemBoxProps, ItemType } from '@/components/dashboard/Box/ItemBox';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

interface CategoryBoxProps
    extends Omit<
        ItemBoxProps,
        'type' | 'onDragStart' | 'onDragEnd' | 'isDraggable' | 'isDragging' | 'setIsDragging' | 'droppableId'
    > {
    icon: CategoryIconType;
}

export function CategoryBox({ title, value, icon, id, isDroppable, onDrop, BoxProps, onTap, styles }: CategoryBoxProps) {
    const droppableId = `${id}-${ItemType.Category}`;
    const { themed } = useAppTheme();
    return (
        <ItemBox
            onTap={onTap}
            type={ItemType.Category}
            id={id}
            droppableId={droppableId}
            title={title}
            value={value}
            isDroppable={isDroppable}
            onDragStart={() => null}
            onDragEnd={() => null}
            onDrop={onDrop}
            isDraggable={false}
            styles={styles}
            BoxProps={{
                BoxDraggableItemProps: {
                    icon,
                    styles: {
                        box: [themed($boxDefault)],
                    },
                },
                styles: {
                    container: BoxProps?.styles?.container,
                },
                payload: BoxProps?.payload,
            }}
        />
    );
}

const $boxDefault: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderColor: colors.border,
    shadowColor: colors.border,
    backgroundColor: colors.palette.neutral100,
    shadowOffset: {
        width: 0,
        height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,

    elevation: 4,
});
