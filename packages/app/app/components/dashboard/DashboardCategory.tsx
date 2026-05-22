import { memo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { CategoryIconType, ICategoryStats, StatsType, TransactionFieldType, TransactionType, Utils } from 'tenpercent/shared';

import { AddBox } from '@/components/dashboard/Box/AddBox';
import { IDrag } from '@/components/dashboard/Box/Box';
import { CategoryBox } from '@/components/dashboard/Box/CategoryBox';
import { useDragOverlay } from '@/components/dashboard/Box/DragOverlayContext';
import { ItemType } from '@/components/dashboard/Box/ItemBox';
import { IDashboardItem } from '@/components/dashboard/DashboardItem';
import { getBudgetPercent, getBudgetStatus, getBudgetStatusLabel } from '@/components/transaction/TransactionStatsBar';
import { useCurrency } from '@/context/CurrencyContext';
import { CategoriesPath } from '@/navigators/CategoriesStackNavigator';
import ToastService from '@/services/ToastService';
import { useAppTheme } from '@/theme/context';
import { BoxDataItemType } from '@/types/BoxDataItemType';
import { OverviewPath } from '@/types/OverviewPath';
import { TransactionPath } from '@/types/TransactionPath';
import { CurrencyUtils } from '@/utils/CurrencyUtils';

export default memo(function DashboardCategory(props: IDashboardItem<ICategoryStats>) {
    const { getCurrencySymbol } = useCurrency();
    const { theme } = useAppTheme();
    const { colors } = theme;
    const { draggingItemType } = useDragOverlay();
    const { BoxProps } = props;
    const navigation = useNavigation();
    const container = props.item;
    switch (container.type) {
        case BoxDataItemType.Default:
            const item = container.data as ICategoryStats;
            const budgetStatus =
                (item?.budget ?? 0) > 0
                    ? getBudgetStatusLabel(getBudgetStatus(getBudgetPercent(item.budget ?? 0, item.amount ?? 0) ?? 0), colors)
                    : colors.textDim;
            return (
                <CategoryBox
                    onTap={() => {
                        navigation.getParent()?.navigate(OverviewPath.Transactions, {
                            screen: TransactionPath.Transactions,
                            params: {
                                id: item.categoryId,
                                name: item.categoryName,
                                path: OverviewPath.Categories,
                                type: TransactionFieldType.Category,
                                statsType: StatsType.Expense,
                                currencyId: item.currencyId,
                            },
                        });
                    }}
                    styles={{
                        value: { color: budgetStatus },
                    }}
                    BoxProps={{
                        styles: BoxProps?.styles,
                        payload: { currencyId: item.currencyId },
                    }}
                    id={String(item.categoryId)}
                    title={item.categoryName}
                    icon={item.iconId as CategoryIconType}
                    value={CurrencyUtils.formatWithDelimiter(item.amount, getCurrencySymbol(item.currencyId), 2, true)}
                    isDroppable={draggingItemType === ItemType.Account}
                    onDrop={(dropItem: unknown) => {
                        const inWorkDropItem: IDrag = dropItem as unknown as IDrag;
                        if (Utils.isNull(item?.categoryId) || Utils.isNull(inWorkDropItem.id)) {
                            ToastService.error({
                                message: 'errorCode:CATEGORY_ERROR',
                                systemMessage: `DnD category miss property categoryId: ${item?.categoryId}, dropId: ${inWorkDropItem.id}`,
                            });
                            return;
                        }
                        if (inWorkDropItem.type === ItemType.Account) {
                            navigation.getParent()?.navigate(OverviewPath.Transactions, {
                                screen: TransactionPath.TransactionCreate,
                                params: {
                                    payload: {
                                        data: {
                                            transactionTypeId: TransactionType.Expense,
                                            categoryId: item.categoryId,
                                            accountId: inWorkDropItem.id,
                                            targetCurrencyId: item.currencyId,
                                            currencyId: inWorkDropItem.payload?.currencyId,
                                        },

                                        uuid: new Date().getMilliseconds(),
                                    },
                                },
                            });
                        } else {
                            ToastService.error({
                                message: 'errorCode:CATEGORY_ERROR',
                                systemMessage: `DnD account unknown item type: ${inWorkDropItem.type}`,
                            });
                        }
                    }}
                />
            );
        default:
            return (
                <AddBox
                    onTap={() => {
                        navigation.getParent()?.navigate(OverviewPath.Categories, {
                            screen: CategoriesPath.CategoriesCreate,
                        });
                    }}
                />
            );
    }
});
