import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IAccount } from 'tenpercent/shared';

import { AccountEdit } from '@/components/account/AccountEdit';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { AccountsPath, AccountsStackParamList } from '@/navigators/AccountsStackNavigator';
import { fetchAccount } from '@/screens/AccountScreens/AccountViewScreen';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';

type Props = NativeStackScreenProps<AccountsStackParamList, AccountsPath.AccountEdit>;

export const AccountEditScreen = function AccountEditScreen(_props: Props) {
    const params = _props?.route?.params as { id: number; name: string; payload: string };
    const { isError, data, isPending } = useAppQuery<IAccount | undefined>(
        QueryKeys.account(params?.id),
        () => fetchAccount(params?.id),
        { staleTime: QueryStaleTimes.detail },
    );
    return (
        <GenericListScreen
            name={data?.accountName ?? translate('accountScreen:editTitle')}
            isError={isError}
            isPending={isPending}
            onBack={undefined}
            props={{
                data,
            }}
            RenderComponent={AccountEdit}
        />
    );
};
