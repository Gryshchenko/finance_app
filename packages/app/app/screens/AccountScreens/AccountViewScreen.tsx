import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IAccount } from 'tenpercent/shared';
import { Utils } from 'tenpercent/shared';

import { AccountView } from '@/components/account/AccountView';
import { useAppQuery } from '@/hooks/useAppQuery';
import { AccountsPath } from '@/navigators/AccountsStackNavigator';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { AccountService } from '@/services/AccountService';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { ValidationError } from '@/utils/errors/ValidationError';
import { Logger } from '@/utils/logger/Logger';

export async function fetchAccount(id: number): Promise<IAccount | undefined> {
    try {
        if (Utils.isNull(id)) {
            throw new ValidationError({
                message: 'ID = null',
            });
        }
        const accountService = AccountService.instance();
        const response = await accountService.doGetAccount(id);
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as IAccount;
            }
            default: {
                return undefined;
            }
        }
    } catch (e) {
        Logger.Of('FetchAccounts').error(`Fetch accountId ${id}  failed due reason: ${(e as { message: string }).message}`);
        return undefined;
    }
}

type Props = NativeStackScreenProps<OverviewTabParamList, AccountsPath.AccountView>;

export const AccountViewScreen = function AccountViewScreen(_props: Props) {
    const params = _props?.route?.params as { id: number; name: string };
    const navigation = useNavigation();
    const { isError, data, isPending } = useAppQuery<IAccount | undefined>(['account', params?.id], () =>
        fetchAccount(params?.id),
    );

    return (
        <GenericListScreen
            name={data?.accountName ?? ''}
            isError={isError}
            isPending={isPending}
            onBack={() =>
                navigation.getParent()?.navigate('balances', {
                    screen: 'accounts',
                })
            }
            props={{
                data,
            }}
            RenderComponent={AccountView}
        />
    );
};
