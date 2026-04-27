import { FC } from 'react';
import { useNavigation } from '@react-navigation/native';
import { AccountIcon, IAccount, Utils } from 'tenpercent/shared';

import { AccountFields } from '@/components/account/AccountFields';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { IAccountClient } from '@/interfaces/IAccountClient';
import { accountCreateSchema } from '@/schems/validationSchemas';
import { AccountService } from '@/services/AccountService';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { InvalidationGroups } from '@/services/QueryCacheService';
import ToastService from '@/services/ToastService';
import { OverviewPath } from '@/types/OverviewPath';

export const AccountCreate: FC = function AccountCreate(_props) {
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();
    const { form, handleChange, save, errors, setErrors } = useEditView<Partial<IAccountClient>>(
        {
            accountName: '',
            currencyId: 1,
            amount: '',
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
            amount: Number(form.amount ?? 0),
            iconId: form.iconId ?? AccountIcon.Wallet,
        });
        if (response.kind === GeneralApiProblemKind.Ok) {
            await invalidateQuery(InvalidationGroups.account());
            navigation.getParent()?.navigate(OverviewPath.Dashboard);
        } else if (response.kind === GeneralApiProblemKind.BadData) {
            handleBadDataResponse(response.errors, setErrors);
        } else {
            buildGeneralApiBaseHandler(response);
        }
    };

    const handleSave = async () => {
        const isValid = await save();
        if (!isValid) return;
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
