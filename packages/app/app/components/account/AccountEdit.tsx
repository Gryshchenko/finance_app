import { FC } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IAccount } from 'tenpercent/shared';
import { Utils } from 'tenpercent/shared';

import { AccountFields } from '@/components/account/AccountFields';
import { EmptyState } from '@/components/EmptyState';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { accountEditSchema } from '@/schems/validationSchemas';
import { AccountService } from '@/services/AccountService';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, parseServerErrors } from '@/services/api/apiProblem';
import { InvalidationGroups } from '@/services/QueryCacheService';
import ToastService from '@/services/ToastService';
import { OverviewPath } from '@/types/OverviewPath';

interface IAccountPros {
    data: Partial<IAccount> | undefined;
}

export const AccountEdit: FC<IAccountPros> = function AccountEdit(_props) {
    const { data } = _props;
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();
    const { form, handleChange, save, errors, setErrors } = useEditView<Partial<IAccount>>(data!, accountEditSchema);

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
            await invalidateQuery(InvalidationGroups.account(form.accountId));
            navigation.goBack();
        } else if (response.kind === GeneralApiProblemKind.BadData) {
            const { fieldErrors, hasNonFieldErrors } = parseServerErrors(response.errors);
            if (Object.keys(fieldErrors).length > 0) {
                setErrors(fieldErrors as any);
            }
            if (hasNonFieldErrors) {
                ToastService.error({ title: 'common:error', message: 'common:updateAccountFailed' });
            }
        } else {
            buildGeneralApiBaseHandler(response);
        }
    };

    const handleSave = async () => {
        const isValid = await save();
        if (!isValid) return;
        await handlePatch();
    };
    if (!data) {
        return (
            <EmptyState
                style={$containerStyleOverride}
                buttonOnPress={() => navigation.getParent()?.navigate(OverviewPath.Dashboard)}
            />
        );
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
                navigation.goBack();
            }}
            handleSave={handleSave}
        />
    );
};
const $containerStyleOverride: StyleProp<ViewStyle> = {
    margin: 'auto',
};
