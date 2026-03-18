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
import { accountEditSchema } from '@/schems/validationSchemas';
import { AccountService } from '@/services/AccountService';
import AlertService from '@/services/AlertService';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';

interface IAccountPros {
    data: Partial<IAccount> | undefined;
}

export const AccountEdit: FC<IAccountPros> = function AccountEdit(_props) {
    const { data } = _props;
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();
    const { form, handleChange, save, errors } = useEditView<Partial<IAccount>>(data!, accountEditSchema);

    const handlePatch = async () => {
        const incomeService = AccountService.instance();
        if (Utils.isEmpty(form.accountName)) return;
        if (Utils.isNull(form.accountId)) return;

        const response = await incomeService.doPatchAccount(form.accountId!, {
            accountName: form.accountName!,
            amount: form.amount!,
            iconId: form.iconId,
        });
        if (response.kind === GeneralApiProblemKind.Ok) {
            AlertService.info(translate('common:info'), translate('common:updateAccountSuccess'));
            await invalidateQuery([['income_accounts']]);
            await invalidateQuery([['income_account', form.accountId]]);
            navigation.getParent()?.navigate('balances', {
                screen: 'accounts',
            });
        } else {
            AlertService.error(translate('common:error'), translate('common:updateAccountFailed'));
        }
    };

    const handleSave = async () => {
        await save();
        await handlePatch();
    };
    if (!data) {
        return <EmptyState style={$containerStyleOverride} buttonOnPress={() => navigation.goBack()} />;
    }

    return (
        <AccountFields
            form={form}
            errors={errors}
            isEdit={true}
            isView={false}
            handleChange={(key: string, value: string | number) => {
                handleChange(key as keyof IAccount, value);
            }}
            cancel={() => {
                navigation.getParent()?.navigate('balances', {
                    screen: 'view',
                    params: { id: form.accountId, name: form.accountName },
                });
            }}
            handleSave={handleSave}
        />
    );
};
const $containerStyleOverride: StyleProp<ViewStyle> = {
    margin: 'auto',
};
