import { memo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { CategoryIconType, IAccountListItem, StatsType, TransactionFieldType, TransactionType, Utils } from 'tenpercent/shared';

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
                        navigation.getParent()?.navigate(OverviewPath.Transactions, {
                            screen: TransactionPath.Transactions,
                            params: {
                                id: item.accountId,
                                name: item.accountName,
                                path: OverviewPath.Accounts,
                                type: TransactionFieldType.Account,
                                statsType: StatsType.Account,
                                currencyCode: item.currencyCode,
                            },
                        });
                    }}
                    BoxProps={{
                        styles: BoxProps?.styles,
                        payload: { currencyCode: item.currencyCode },
                    }}
                    id={String(item.accountId)}
                    key={item.accountName}
                    title={item.accountName}
                    icon={item.iconId as CategoryIconType}
                    colorId={item.colorId}
                    value={CurrencyUtils.formatWithDelimiter(item.amount, getCurrencySymbol(item.currencyCode), 2, true)}
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
                                                data: {
                                                    transactionTypeId: TransactionType.Transafer,
                                                    accountId: inWorkDropItem.id,
                                                    targetAccountId: item.accountId,
                                                    targetCurrencyCode: item.currencyCode,
                                                    currencyCode: inWorkDropItem.payload?.currencyCode,
                                                },
                                                uuid: new Date().getMilliseconds(),
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
                                            data: {
                                                transactionTypeId: TransactionType.Income,
                                                accountId: item.accountId,
                                                incomeId: inWorkDropItem.id,
                                                targetCurrencyCode: item.currencyCode,
                                                currencyCode: inWorkDropItem.payload?.currencyCode,
                                            },
                                            uuid: new Date().getMilliseconds(),
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
                    onTap={() => {
                        navigation.getParent()?.navigate(OverviewPath.Accounts, {
                            screen: AccountsPath.AccountsCreate,
                        });
                    }}
                />
            );
        }
    }
});
