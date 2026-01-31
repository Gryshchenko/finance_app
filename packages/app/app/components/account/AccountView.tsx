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
import { AccountService } from '@/services/AccountService';
import AlertService from '@/services/AlertService';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';

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
            AlertService.info(translate('common:info'), translate('common:deleteAccountSuccess'));
            await invalidateQuery([['account_accounts']]);
            await invalidateQuery([['account_account', form.accountId]]);
        } else {
            AlertService.error(translate('common:error'), translate('common:deleteAccountFailed'));
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
            isEdit={false}
            form={form}
            isView={true}
            edit={() => {
                navigation.getParent()?.navigate('balances', {
                    screen: 'edit',
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
