import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { IAccount } from 'tenpercent/shared';
import { IAccountListItem } from 'tenpercent/shared';
import { TransactionFieldType } from 'tenpercent/shared';
import { TransactionType } from 'tenpercent/shared';

import { Accounts } from '@/components/account/Accounts';
import { AddButton } from '@/components/buttons/AddButton';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { AccountService } from '@/services/AccountService';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { OverviewPath } from '@/types/OverviewPath';
import { TransactionPath } from '@/types/TransactionPath';
import { Logger } from '@/utils/logger/Logger';

export async function fetchAccounts(): Promise<IAccountListItem[] | undefined> {
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

type Props = BottomTabScreenProps<OverviewTabParamList, 'accounts'>;

export const AccountsScreen = function AccountsScreen(_props: Props) {
    const { isError, data, isPending } = useAppQuery<IAccountListItem[] | undefined>('accounts', fetchAccounts);
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
                    navigation.getParent()?.navigate(OverviewPath.Balances, {
                        screen: TransactionPath.Transactions,
                        params: { id, name, type: TransactionFieldType.Account, path: OverviewPath.Balances },
                    });
                },
            }}
            RightActionComponent={
                <AddButton
                    onPress={() => {
                        navigation.getParent()?.navigate(OverviewPath.Balances, {
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
