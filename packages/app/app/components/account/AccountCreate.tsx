import { FC } from 'react';
import { useNavigation } from '@react-navigation/native';
import { IAccount } from 'tenpercent/shared';
import { Utils } from 'tenpercent/shared';

import { AccountFields } from '@/components/account/AccountFields';
import { useEditView } from '@/hooks/useEditView';
import { translate } from '@/i18n/translate';
import { accountCreateSchema } from '@/schems/validationSchemas';
import { AccountService } from '@/services/AccountService';
import AlertService from '@/services/AlertService';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';

export const AccountCreate: FC = function AccountCreate(_props) {
    const navigation = useNavigation();
    const { form, handleChange, save, errors } = useEditView<Partial<IAccount>>(
        {
            accountName: '',
            currencyId: 1,
            amount: 0,
        },
        accountCreateSchema,
    );

    const handleCreate = async () => {
        const accountService = AccountService.instance();
        if (Utils.isEmpty(form.accountName)) return;
        if (Utils.isNull(form.currencyId)) return;

        const response = await accountService.doCreateAccount({
            accountName: form.accountName!,
            currencyId: form.currencyId!,
            amount: form.amount ?? 0,
        });
        if (response.kind === GeneralApiProblemKind.Ok) {
            AlertService.info(translate('common:info'), translate('common:createAccountSuccess'));
            navigation.getParent()?.navigate('balances', {
                screen: 'accounts',
            });
        } else {
            AlertService.error(translate('common:error'), translate('common:createAccountFailed'));
        }
    };

    const handleSave = async () => {
        await save();
        await handleCreate();
    };

    return (
        <AccountFields
            isEdit={true}
            form={form}
            errors={errors}
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
