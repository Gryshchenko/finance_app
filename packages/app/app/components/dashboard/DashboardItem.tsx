import { useState, ComponentType, memo } from 'react';
import { View, ViewStyle } from 'react-native';

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
}

export const DASH_BOARD_ITEM_WIDTH: number = 80;

export default memo(function DashboardItem(props: IProps) {
    const { Item, items, keyGetter } = props;
    const { themed } = useAppTheme();
    const [containerWidth, setContainerWidth] = useState(0);

    const { matrix, payload } = buildMatrix<unknown>({
        containerWidth,
        itemWidth: DASH_BOARD_ITEM_WIDTH,
        gap: 0,
        padding: 0,
        items: items ?? [],
    });
    return (
        <View onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
            {matrix.map((row: unknown[], y: number) => (
                <View key={y} style={themed($item)}>
                    {row.map((item: unknown, index: number) => {
                        return (
                            <>
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
                            </>
                        );
                    })}
                </View>
            ))}
        </View>
    );
});

export const $item: ThemedStyle<ViewStyle> = () => ({
    flexDirection: 'row',
    marginBottom: 10,
});
