import { ViewStyle } from 'react-native';

import ItemBox, { ItemType } from '@/components/dashboard/Box/ItemBox';
import { translate } from '@/i18n/translate';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

interface AddBoxProps {
    onTap?: () => void;
}

export function AddBox({ onTap }: AddBoxProps) {
    const { themed } = useAppTheme();
    return (
        <ItemBox
            onTap={onTap}
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
    );
}
const $boxDefault: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderStyle: 'dashed',
    borderColor: colors.palette.grey400,
    backgroundColor: colors.background,
});
