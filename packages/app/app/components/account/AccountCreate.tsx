import { FC, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { AccountIcon, IAccount, Utils } from 'tenpercent/shared';

import { AccountFields } from '@/components/account/AccountFields';
import { useCurrency } from '@/context/CurrencyContext';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { IAccountClient } from '@/interfaces/IAccountClient';
import { buildAccountCreateSchema } from '@/schems/validationSchemas';
import { AccountService } from '@/services/AccountService';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { InvalidationGroups } from '@/services/QueryCacheService';
import ToastService from '@/services/ToastService';
import { OverviewPath } from '@/types/OverviewPath';

export const AccountCreate: FC = function AccountCreate(_props) {
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();
    const { currencies } = useCurrency();
    const accountCreateSchema = useMemo(() => buildAccountCreateSchema(Array.from(currencies.keys())), [currencies]);
    const { form, handleChange, save, errors, setErrors } = useEditView<Partial<IAccountClient>>(
        {
            accountName: '',
            currencyCode: 'USD',
            amount: undefined,
            iconId: AccountIcon.Wallet,
        },
        accountCreateSchema,
    );

    const handleCreate = async () => {
        const accountService = AccountService.instance();
        if (Utils.isEmpty(form.accountName) || Utils.isNull(form.currencyCode) || Utils.isNull(form.iconId)) {
            ToastService.error({
                message: 'errorCode:UNKNOWN_ERROR',
                systemMessage: `Validation error on create account, accountName: ${form.accountName}, currencyCode: ${form.currencyCode}, iconId: ${form.iconId}`,
            });
            return;
        }

        const response = await accountService.doCreateAccount({
            accountName: form.accountName!,
            currencyCode: form.currencyCode!,
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
