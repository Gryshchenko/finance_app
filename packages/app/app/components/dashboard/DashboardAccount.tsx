import { memo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { CategoryIconType, IAccountListItem, TransactionType, Utils } from 'tenpercent/shared';

import { AccountBox } from '@/components/dashboard/Box/AccountBox';
import { AddBox } from '@/components/dashboard/Box/AddBox';
import { IDrag } from '@/components/dashboard/Box/Box';
import { useDragOverlay } from '@/components/dashboard/Box/DragOverlayContext';
import { ItemType } from '@/components/dashboard/Box/ItemBox';
import { IDashboardItem } from '@/components/dashboard/DashboardItem';
import { useCurrency } from '@/context/CurrencyContext';
import { AccountsPath } from '@/navigators/AccountsStackNavigator';
import ToastService from '@/services/ToastService';
import { BoxDataItemType } from '@/types/BoxDataItemType';
import { OverviewPath } from '@/types/OverviewPath';
import { TransactionPath } from '@/types/TransactionPath';
import { CurrencyUtils } from '@/utils/CurrencyUtils';

export default memo(function DashboardAccount(props: IDashboardItem<IAccountListItem>) {
    const { getCurrencySymbol } = useCurrency();
    const { setDraggingItemType, draggingItemType } = useDragOverlay();
    const { BoxProps } = props;
    const container = props.item;
    const navigation = useNavigation();
    switch (container.type) {
        case BoxDataItemType.Default: {
            const item = container.data as IAccountListItem;
            return (
                <AccountBox
                    onTap={() => {
                        navigation.getParent()?.navigate(OverviewPath.Balances, {
                            screen: AccountsPath.AccountView,
                            params: {
                                id: item.accountId,
                                name: item.accountName,
                            },
                        });
                    }}
                    BoxProps={{
                        styles: BoxProps?.styles,
                        payload: { currencyId: item.currencyId },
                    }}
                    id={String(item.accountId)}
                    key={item.accountName}
                    title={item.accountName}
                    icon={item.iconId as CategoryIconType}
                    value={CurrencyUtils.formatWithDelimiter(item.amount, getCurrencySymbol(item.currencyId), 2, true)}
                    isDraggable={true}
                    onDragStart={() => {
                        setDraggingItemType(ItemType.Account);
                    }}
                    onDragEnd={() => {
                        setDraggingItemType(undefined);
                    }}
                    isDroppable={[ItemType.Account, ItemType.Income].includes(draggingItemType as ItemType)}
                    onDrop={(dropItem) => {
                        const inWorkDropItem: IDrag = dropItem as unknown as IDrag;
                        if (Utils.isNull(item?.accountId) || Utils.isNull(inWorkDropItem.id)) {
                            ToastService.error({
                                message: 'errorCode:ACCOUNT_ERROR',
                                systemMessage: `DnD account miss property accountId: ${item?.accountId}, dropId: ${inWorkDropItem.id}`,
                            });
                            return;
                        }
                        switch (inWorkDropItem.type) {
                            case ItemType.Account:
                                {
                                    navigation.getParent()?.navigate(OverviewPath.Transactions, {
                                        screen: TransactionPath.TransactionCreate,
                                        params: {
                                            payload: {
                                                transactionTypeId: TransactionType.Transafer,
                                                accountId: item.accountId,
                                                targetAccountId: inWorkDropItem.id,
                                                currencyId: item.currencyId,
                                                sourceCurrencyId: inWorkDropItem.payload?.currencyId,
                                            },
                                        },
                                    });
                                }
                                break;
                            case ItemType.Income: {
                                navigation.getParent()?.navigate(OverviewPath.Transactions, {
                                    screen: TransactionPath.TransactionCreate,
                                    params: {
                                        payload: {
                                            transactionTypeId: TransactionType.Income,
                                            accountId: item.accountId,
                                            incomeId: inWorkDropItem.id,
                                            currencyId: item.currencyId,
                                            sourceCurrencyId: inWorkDropItem.payload?.currencyId,
                                        },
                                    },
                                });
                                break;
                            }
                            default: {
                                ToastService.error({
                                    message: 'errorCode:ACCOUNT_ERROR',
                                    systemMessage: `DnD account unknown item type: ${inWorkDropItem.type}`,
                                });
                            }
                        }
                    }}
                />
            );
        }
        default: {
            return (
                <AddBox
                    onPress={() => {
                        navigation.getParent()?.navigate(OverviewPath.Balances, {
                            screen: AccountsPath.AccountsCreate,
                        });
                    }}
                />
            );
        }
    }
});
