import { ComponentType } from 'react';
import { IAccount, IAccountListItem } from 'tenpercent/shared';

import { boxDataItemAdapter } from '@/components/dashboard/Box/boxDataItemAdapter';
import { ItemType } from '@/components/dashboard/Box/ItemBox';
import DashboardAccount from '@/components/dashboard/DashboardAccount';
import { DashboardBlockSkeleton } from '@/components/dashboard/DashboardBlockSkeleton';
import DashboardItem, { IDashboardItem } from '@/components/dashboard/DashboardItem';
import { useAppQuery } from '@/hooks/useAppQuery';
import { IBoxDataItem } from '@/interfaces/IBoxDataItem';
import { AccountService } from '@/services/AccountService';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { BoxDataItemType } from '@/types/BoxDataItemType';
import { Logger } from '@/utils/logger/Logger';

export async function fetchAccounts(): Promise<IAccountListItem[] | []> {
    try {
        const accountService = AccountService.instance();
        const response = await accountService.doGetAccounts();
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as IAccount[];
            }
            default: {
                return [];
            }
        }
    } catch (e) {
        Logger.Of('FetchAccounts').error(`Fetch account failed due reason: ${(e as { message: string }).message}`);
        return [];
    }
}

export default function DashboardAccountsItem() {
    const accounts = useAppQuery<IAccountListItem[]>(QueryKeys.accounts(), fetchAccounts, {
        staleTime: QueryStaleTimes.list,
    });

    if (accounts.isPending) {
        return <DashboardBlockSkeleton />;
    }

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
