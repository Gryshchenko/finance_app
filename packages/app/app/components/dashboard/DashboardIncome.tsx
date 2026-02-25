import { memo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { IIncome, TransactionType } from 'tenpercent/shared';

import { AddBox } from '@/components/Box/AddBox';
import { useDragOverlay } from '@/components/Box/DragOverlayContext';
import { IncomeBox } from '@/components/Box/IncomeBox';
import { ItemType } from '@/components/Box/ItemBox';
import { IDashboardItem } from '@/components/dashboard/DashboardItem';
import { useCurrency } from '@/context/CurrencyContext';
import { IncomePath } from '@/navigators/IncomesStackNavigator';
import { BoxDataItemType } from '@/types/BoxDataItemType';
import { OverviewPath } from '@/types/OverviewPath';
import { CurrencyUtils } from '@/utils/CurrencyUtils';

export default memo(function DashboardIncome(props: IDashboardItem<IIncome>) {
    const { getCurrencySymbol } = useCurrency();
    const { setDraggingItemType } = useDragOverlay();
    const { BoxProps } = props;
    const container = props.item;
    const navigation = useNavigation();
    switch (container.type) {
        case BoxDataItemType.Default: {
            const item = container.data as IIncome;
            return (
                <IncomeBox
                    BoxProps={{
                        styles: BoxProps?.styles,
                    }}
                    id={String(item.incomeId)}
                    key={item.incomeName}
                    title={item.incomeName}
                    icon={'tmp'}
                    value={CurrencyUtils.formatWithDelimiter(231, getCurrencySymbol(item.currencyId))}
                    isDraggable={true}
                    onDragStart={() => {
                        setDraggingItemType(ItemType.Income);
                    }}
                    onDragEnd={() => {
                        setDraggingItemType(undefined);
                    }}
                />
            );
        }
        default:
            return (
                <AddBox
                    onPress={() => {
                        navigation.getParent()?.navigate(OverviewPath.Incomes, {
                            screen: IncomePath.IncomeCreate,
                            payload: {
                                transactionTypeId: TransactionType.Income,
                            },
                        });
                    }}
                />
            );
    }
});
