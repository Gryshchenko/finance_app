import { Pressable, ViewStyle } from 'react-native';

import ItemBox, { ItemType } from '@/components/Box/ItemBox';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

interface AddBoxProps {
    onPress?: () => void;
}

export function AddBox({ onPress }: AddBoxProps) {
    const { themed } = useAppTheme();
    return (
        <Pressable onPress={() => onPress?.()}>
            <ItemBox
                type={ItemType.Account}
                id={'add'}
                droppableId={'add'}
                title={'Add'}
                icon={''}
                value={undefined}
                isDroppable={false}
                isDraggable={false}
                onDragStart={() => null}
                onDragEnd={() => null}
                onDrop={() => null}
                BoxProps={{
                    styles: {
                        box: themed($boxDefault),
                    },
                }}
            />
        </Pressable>
    );
}
const $boxDefault: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderStyle: 'dashed',
    borderColor: colors.palette.grey400,
    backgroundColor: colors.palette.grey300,
});
