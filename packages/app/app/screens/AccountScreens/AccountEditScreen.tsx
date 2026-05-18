import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IAccount, Utils } from 'tenpercent/shared';

import { AccountEdit } from '@/components/account/AccountEdit';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { AccountsPath, AccountsStackParamList } from '@/navigators/AccountsStackNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { AccountService } from '@/services/AccountService';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import type { BackTarget } from '@/types/BackTarget';
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
type Props = NativeStackScreenProps<AccountsStackParamList, AccountsPath.AccountEdit>;

export const AccountEditScreen = function AccountEditScreen(_props: Props) {
    const params = _props?.route?.params as {
        id: number;
        name: string;
        payload: string;
        back?: BackTarget;
    };
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
                back: params?.back,
            }}
            RenderComponent={AccountEdit}
        />
    );
};
