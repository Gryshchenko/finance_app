import { FC } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IAccount } from 'tenpercent/shared';
import { Utils } from 'tenpercent/shared';

import { AccountFields } from '@/components/account/AccountFields';
import { EmptyState } from '@/components/EmptyState';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { AccountsPath } from '@/navigators/AccountsStackNavigator';
import { accountEditSchema } from '@/schems/validationSchemas';
import { AccountService } from '@/services/AccountService';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import ToastService from '@/services/ToastService';
import { OverviewPath } from '@/types/OverviewPath';

interface IAccountPros {
    data: Partial<IAccount> | undefined;
}

export const AccountEdit: FC<IAccountPros> = function AccountEdit(_props) {
    const { data } = _props;
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();
    const { form, handleChange, save, errors } = useEditView<Partial<IAccount>>(data!, accountEditSchema);

    const handlePatch = async () => {
        const accountService = AccountService.instance();
        if (Utils.isEmpty(form.accountName)) return;
        if (Utils.isNull(form.accountId)) return;

        const response = await accountService.doPatchAccount(form.accountId!, {
            accountName: form.accountName!,
            amount: form.amount!,
            iconId: form.iconId,
        });
        if (response.kind === GeneralApiProblemKind.Ok) {
            ToastService.info({
                title: 'common:info',
                message: 'common:updateAccountSuccess',
            });
            await invalidateQuery([['accounts']]);
            await invalidateQuery([['account', form.accountId]]);
            navigation.getParent()?.navigate(OverviewPath.Dashboard);
        } else {
            ToastService.error({
                title: 'common:error',
                message: 'common:updateAccountFailed',
            });
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
            isCreate={false}
            isEdit={true}
            errors={errors}
            isView={false}
            handleChange={(key: string, value: string | number) => {
                handleChange(key as keyof IAccount, value);
            }}
            cancel={() => {
                navigation.getParent()?.navigate(OverviewPath.Accounts, {
                    screen: AccountsPath.AccountEdit,
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
