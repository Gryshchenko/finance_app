import { FC } from 'react';
import { useNavigation } from '@react-navigation/native';
import { AccountIcon, IAccount, Utils } from 'tenpercent/shared';

import { AccountFields } from '@/components/account/AccountFields';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { accountCreateSchema } from '@/schems/validationSchemas';
import { AccountService } from '@/services/AccountService';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { InvalidationGroups } from '@/services/QueryCacheService';
import ToastService from '@/services/ToastService';
import { OverviewPath } from '@/types/OverviewPath';

export const AccountCreate: FC = function AccountCreate(_props) {
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();
    const { form, handleChange, save, errors } = useEditView<Partial<IAccount>>(
        {
            accountName: '',
            currencyId: 1,
            amount: 0,
            iconId: AccountIcon.Wallet,
        },
        accountCreateSchema,
    );

    const handleCreate = async () => {
        const accountService = AccountService.instance();
        if (Utils.isEmpty(form.accountName) || Utils.isNull(form.currencyId) || Utils.isNull(form.iconId)) {
            ToastService.error({
                message: 'errorCode:UNKNOWN_ERROR',
                systemMessage: `Validation error on create account, accountName: ${form.accountName}, currencyId: ${form.currencyId}, iconId: ${form.iconId}`,
            });
            return;
        }

        const response = await accountService.doCreateAccount({
            accountName: form.accountName!,
            currencyId: form.currencyId!,
            amount: form.amount ?? 0,
            iconId: form.iconId ?? AccountIcon.Wallet,
        });
        if (response.kind === GeneralApiProblemKind.Ok) {
            await invalidateQuery(InvalidationGroups.account());
            navigation.getParent()?.navigate(OverviewPath.Dashboard);
        } else {
            ToastService.error({
                message: 'errorCode:UNKNOWN_ERROR',
                systemMessage: `response kind: ${response.kind}, on create account with name: ${form.accountName}, currencyId: ${form.currencyId}, iconId: ${form.iconId}`,
            });
        }
    };

    const handleSave = async () => {
        await save();
        await handleCreate();
    };

    return (
        <AccountFields
            isCreate={true}
            isEdit={true}
            form={form}
            errors={errors}
            isView={false}
            handleChange={(key: string, value: string | number) => {
                handleChange(key as keyof IAccount, value);
            }}
            cancel={() => {
                navigation.getParent()?.navigate(OverviewPath.Dashboard);
            }}
            handleSave={handleSave}
        />
    );
};
