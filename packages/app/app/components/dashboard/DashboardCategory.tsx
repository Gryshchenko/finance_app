import { memo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ICategory, TransactionType, Utils } from 'tenpercent/shared';

import { IDrag } from '@/components/Box/Box';
import { CategoryBox } from '@/components/Box/CategoryBox';
import { useDragOverlay } from '@/components/Box/DragOverlayContext';
import { ItemType } from '@/components/Box/ItemBox';
import { IDashboardItem } from '@/components/dashboard/DashboardItem';
import { useCurrency } from '@/context/CurrencyContext';
import ToastService from '@/services/ToastService';
import { OverviewPath } from '@/types/OverviewPath';
import { TransactionPath } from '@/types/TransactionPath';
import { CurrencyUtils } from '@/utils/CurrencyUtils';

export default memo(function DashboardCategory(props: IDashboardItem) {
    const { getCurrencySymbol } = useCurrency();
    const { draggingType } = useDragOverlay();
    const { BoxProps } = props;
    const navigation = useNavigation();
    const item = props.item as ICategory;
    return (
        <CategoryBox
            BoxProps={{
                styles: BoxProps?.styles,
            }}
            id={String(item.categoryId)}
            title={item.categoryName}
            icon={'tmp'}
            value={CurrencyUtils.formatWithDelimiter(2321, getCurrencySymbol(item.currencyId))}
            isDroppable={draggingType === ItemType.Account}
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
                    navigation.getParent()?.navigate(OverviewPath.Balances, {
                        screen: TransactionPath.TransactionCreate,
                        params: {
                            payload: {
                                transactionTypeId: TransactionType.Expense,
                                categoryId: item.categoryId,
                                accountId: inWorkDropItem.id,
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
});
