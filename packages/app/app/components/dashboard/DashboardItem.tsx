import { useState, ComponentType, memo } from 'react';
import { View, ViewStyle } from 'react-native';

import { ItemType } from '@/components/dashboard/Box/ItemBox';
import DashboardExpandableGrid from '@/components/dashboard/DashboardExpandableGrid';
import { IBoxDataItem } from '@/interfaces/IBoxDataItem';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';
import { buildMatrix } from '@/utils/buildMatrix';

export interface IDashboardItem<T> {
    item: IBoxDataItem<T>;
    key: string | number;
    BoxProps?: {
        styles?: {
            box?: ViewStyle;
            container?: ViewStyle;
        };
    };
}

interface IProps<T = unknown> {
    Item: ComponentType<IDashboardItem<T>>;
    items: IBoxDataItem<T>[];
    keyGetter?: (item: IBoxDataItem<T>) => string;
    isExpanded?: boolean;
    id: string;
    /** Passed through to DashboardExpandableGrid - controls which drag types trigger auto-expand. */
    acceptedDragTypes?: ItemType[];
}

export const DASH_BOARD_ITEM_WIDTH: number = 80;

export default memo(function DashboardItem(props: IProps) {
    const { Item, items, keyGetter, isExpanded, id, acceptedDragTypes } = props;
    const { themed } = useAppTheme();
    const [containerWidth, setContainerWidth] = useState(0);

    const { matrix, payload } = buildMatrix<unknown>({
        containerWidth,
        itemWidth: DASH_BOARD_ITEM_WIDTH,
        gap: 0,
        padding: 0,
        items: items ?? [],
    });
    const content = (
        <View onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
            {matrix.map((row: unknown[], y: number) => (
                <View key={y} style={themed($item)}>
                    {row.map((item: unknown, index: number) => {
                        return (
                            <Item
                                key={keyGetter?.(item as IBoxDataItem<unknown>) ?? y + index}
                                item={item as IBoxDataItem<unknown>}
                                BoxProps={{
                                    styles: {
                                        container: {
                                            alignItems: 'center',
                                            marginRight: index !== row.length - 1 ? payload.calculatedGap : 0,
                                        },
                                    },
                                }}
                            />
                        );
                    })}
                </View>
            ))}
        </View>
    );
    if (!isExpanded) return content;
    return (
        <DashboardExpandableGrid rowHeight={110} id={id} rows={matrix?.length} acceptedDragTypes={acceptedDragTypes}>
            {content}
        </DashboardExpandableGrid>
    );
});

export const $item: ThemedStyle<ViewStyle> = () => ({
    flexDirection: 'row',
    marginBottom: 10,
});
