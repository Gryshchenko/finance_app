import { ComponentType } from 'react';
import { IAccountListItem } from 'tenpercent/shared';

import { boxDataItemAdapter } from '@/components/dashboard/Box/boxDataItemAdapter';
import { ItemType } from '@/components/dashboard/Box/ItemBox';
import DashboardAccount from '@/components/dashboard/DashboardAccount';
import DashboardItem, { IDashboardItem } from '@/components/dashboard/DashboardItem';
import { useAppQuery } from '@/hooks/useAppQuery';
import { IBoxDataItem } from '@/interfaces/IBoxDataItem';
import { fetchAccounts } from '@/screens/AccountScreens/AccountsScreen';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { BoxDataItemType } from '@/types/BoxDataItemType';

export default function DashboardAccountsItem() {
    const accounts = useAppQuery<IAccountListItem[]>(QueryKeys.accounts(), fetchAccounts, {
        staleTime: QueryStaleTimes.list,
    });
    return (
        <DashboardItem
            id={'accounts'}
            isExpanded={true}
            acceptedDragTypes={[ItemType.Account, ItemType.Income]}
            keyGetter={(item: IBoxDataItem<unknown>): string => {
                if (item.type === BoxDataItemType.Default) {
                    return String((item.data as IAccountListItem)?.accountId);
                }
                return 'new-accounts';
            }}
            Item={DashboardAccount as ComponentType<IDashboardItem<unknown>>}
            items={boxDataItemAdapter<IAccountListItem>(accounts.data ?? [])}
        />
    );
}
