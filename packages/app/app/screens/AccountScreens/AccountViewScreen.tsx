import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IAccount, Utils } from 'tenpercent/shared';

import { AccountView } from '@/components/account/AccountView';
import { useAppQuery } from '@/hooks/useAppQuery';
import { AccountsPath, AccountsStackParamList } from '@/navigators/AccountsStackNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { AccountService } from '@/services/AccountService';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { OverviewPath } from '@/types/OverviewPath';
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

type Props = NativeStackScreenProps<AccountsStackParamList, AccountsPath.AccountView>;

export const AccountViewScreen = function AccountViewScreen(_props: Props) {
    const params = _props?.route?.params as { id: number; name: string };
    const navigation = useNavigation();
    const { isError, data, isPending } = useAppQuery<IAccount | undefined>(
        QueryKeys.account(params?.id),
        () => fetchAccount(params?.id),
        { staleTime: QueryStaleTimes.detail },
    );

    return (
        <GenericListScreen
            name={data?.accountName ?? ''}
            isError={isError}
            isPending={isPending}
            onBack={() => navigation.getParent()?.navigate(OverviewPath.Dashboard)}
            props={{
                data,
            }}
            RenderComponent={AccountView}
        />
    );
};
