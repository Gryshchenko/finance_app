import { Pressable, ViewStyle } from 'react-native';

import ItemBox, { ItemType } from '@/components/dashboard/Box/ItemBox';
import { translate } from '@/i18n/translate';
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
                title={translate('dashboardScreen:add')}
                value={undefined}
                isDroppable={false}
                isDraggable={false}
                onDragStart={() => null}
                onDragEnd={() => null}
                onDrop={() => null}
                BoxProps={{
                    BoxDraggableItemProps: {
                        icon: 'add',
                        styles: {
                            box: [themed($boxDefault)],
                        },
                    },
                }}
            />
        </Pressable>
    );
}
const $boxDefault: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderStyle: 'dashed',
    borderColor: colors.palette.grey400,
    backgroundColor: colors.background,
});
