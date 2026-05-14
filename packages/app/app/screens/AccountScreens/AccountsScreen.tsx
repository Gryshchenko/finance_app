import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IAccount, IAccountListItem, TransactionFieldType, TransactionType } from 'tenpercent/shared';

import { Accounts } from '@/components/account/Accounts';
import { AddButton } from '@/components/buttons/AddButton';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { AccountsPath, AccountsStackParamList } from '@/navigators/AccountsStackNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { AccountService } from '@/services/AccountService';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { OverviewPath } from '@/types/OverviewPath';
import { TransactionPath } from '@/types/TransactionPath';
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

type Props = NativeStackScreenProps<AccountsStackParamList, AccountsPath.Accounts>;

export const AccountsScreen = function AccountsScreen(_props: Props) {
    const { isError, data, isPending } = useAppQuery<IAccountListItem[] | undefined>(QueryKeys.accounts(), fetchAccounts, {
        staleTime: QueryStaleTimes.list,
    });
    const navigation = useNavigation();

    return (
        <GenericListScreen
            name={translate('common:balance')}
            isError={isError}
            isPending={isPending}
            props={{
                data,
                fetch: fetchAccounts,
                onPress: (id: number, name: string) => {
                    navigation.getParent()?.navigate(OverviewPath.Accounts, {
                        screen: TransactionPath.Transactions,
                        params: {
                            id,
                            name,
                            type: TransactionFieldType.Account,
                            path: OverviewPath.Accounts,
                        },
                    });
                },
            }}
            RightActionComponent={
                <AddButton
                    onPress={() => {
                        navigation.getParent()?.navigate(OverviewPath.Accounts, {
                            screen: TransactionPath.TransactionCreate,
                            params: {
                                payload: {
                                    transactionTypeId: TransactionType.Transafer,
                                },
                            },
                        });
                    }}
                />
            }
            RenderComponent={Accounts}
        />
    );
};
