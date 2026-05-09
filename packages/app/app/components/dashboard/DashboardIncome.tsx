import { memo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { CategoryIconType, IIncomeStats, TransactionFieldType, TransactionType } from 'tenpercent/shared';

import { AddBox } from '@/components/dashboard/Box/AddBox';
import { useDragOverlay } from '@/components/dashboard/Box/DragOverlayContext';
import { IncomeBox } from '@/components/dashboard/Box/IncomeBox';
import { ItemType } from '@/components/dashboard/Box/ItemBox';
import { IDashboardItem } from '@/components/dashboard/DashboardItem';
import { useCurrency } from '@/context/CurrencyContext';
import { IncomePath } from '@/navigators/IncomesStackNavigator';
import { BoxDataItemType } from '@/types/BoxDataItemType';
import { OverviewPath } from '@/types/OverviewPath';
import { TransactionPath } from '@/types/TransactionPath';
import { CurrencyUtils } from '@/utils/CurrencyUtils';

export default memo(function DashboardIncome(props: IDashboardItem<IIncomeStats>) {
    const { getCurrencySymbol } = useCurrency();
    const { setDraggingItemType } = useDragOverlay();
    const { BoxProps } = props;
    const container = props.item;
    const navigation = useNavigation();
    switch (container.type) {
        case BoxDataItemType.Default: {
            const item = container.data as IIncomeStats;
            return (
                <IncomeBox
                    onTap={() => {
                        navigation.getParent()?.navigate(OverviewPath.Incomes, {
                            screen: TransactionPath.Transactions,
                            params: {
                                id: item.incomeId,
                                name: item.incomeName,
                                path: OverviewPath.Incomes,
                                type: TransactionFieldType.Income,
                                transactionType: TransactionType.Income,
                            },
                        });
                    }}
                    BoxProps={{
                        styles: BoxProps?.styles,
                        payload: { currencyId: item.currencyId },
                    }}
                    icon={item.iconId as CategoryIconType}
                    id={String(item.incomeId)}
                    key={item.incomeName}
                    title={item.incomeName}
                    value={CurrencyUtils.formatWithDelimiter(item.amount, getCurrencySymbol(item.currencyId), 2, true)}
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
        case BoxDataItemType.New:
        default:
            return (
                <AddBox
                    onTap={() => {
                        navigation.getParent()?.navigate(OverviewPath.Incomes, {
                            screen: IncomePath.IncomeCreate,
                        });
                    }}
                />
            );
    }
});
