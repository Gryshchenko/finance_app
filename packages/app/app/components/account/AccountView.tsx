import { FC } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IAccount } from 'tenpercent/shared';
import { Utils } from 'tenpercent/shared';

import { AccountFields } from '@/components/account/AccountFields';
import { EmptyState } from '@/components/EmptyState';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { translate } from '@/i18n/translate';
import { AccountsPath } from '@/navigators/AccountsStackNavigator';
import { AccountService } from '@/services/AccountService';
import AlertService from '@/services/AlertService';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import ToastService from '@/services/ToastService';
import { OverviewPath } from '@/types/OverviewPath';

interface IAccountPros {
    data: IAccount | undefined;
}

export const AccountView: FC<IAccountPros> = function AccountView(_props) {
    const { data } = _props;
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();
    const { form } = useEditView<IAccount>(data!);

    const handleDelete = async () => {
        const accountService = AccountService.instance();
        if (!form.accountId) return;

        const response = await accountService.doDeleteAccount(form.accountId);
        if (response.kind === GeneralApiProblemKind.Ok) {
            ToastService.info({
                title: 'common:info',
                message: 'common:deleteAccountSuccess',
            });
            await invalidateQuery([['accounts']]);
            await invalidateQuery([['account', form.accountId]]);
            navigation.getParent()?.navigate(OverviewPath.Dashboard);
        } else {
            ToastService.error({
                title: 'common:error',
                message: 'common:deleteAccountFailed',
            });
        }
    };

    const onDelete = () => {
        AlertService.confirm(translate('common:deleteAccountTitle'), translate('common:deleteAccountMessage'), handleDelete);
    };

    if (!data) {
        return <EmptyState style={$containerStyleOverride} buttonOnPress={() => navigation.goBack()} />;
    }

    return (
        <AccountFields
            isCreate={false}
            isEdit={false}
            form={form}
            isView={true}
            edit={() => {
                navigation.getParent()?.navigate(OverviewPath.Accounts, {
                    screen: AccountsPath.AccountEdit,
                    params: {
                        id: form.accountId,
                        name: form.accountName,
                        payload: Utils.objectToString(form),
                    },
                });
            }}
            onDelete={onDelete}
        />
    );
};
const $containerStyleOverride: StyleProp<ViewStyle> = {
    margin: 'auto',
};
