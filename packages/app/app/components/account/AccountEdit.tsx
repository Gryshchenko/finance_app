import { FC } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { IAccount, Utils } from 'tenpercent/shared';

import { AccountFields } from '@/components/account/AccountFields';
import { EmptyState } from '@/components/EmptyState';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { useGoBackSmart } from '@/hooks/useGoBackSmart';
import { translate } from '@/i18n/translate';
import { IAccountClient } from '@/interfaces/IAccountClient';
import { accountEditSchema } from '@/schems/validationSchemas';
import { AccountService } from '@/services/AccountService';
import AlertService from '@/services/AlertService';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { InvalidationGroups } from '@/services/QueryCacheService';
import ToastService from '@/services/ToastService';
import type { BackTarget } from '@/types/BackTarget';

interface IAccountPros {
    data: Partial<IAccountClient> | undefined;
    back?: BackTarget;
}

export const AccountEdit: FC<IAccountPros> = function AccountEdit(_props) {
    const { data, back } = _props;
    const invalidateQuery = useInvalidateQuery();
    const { form, handleChange, save, errors, setErrors } = useEditView<Partial<IAccountClient>>(data!, accountEditSchema);
    const goBackSmart = useGoBackSmart(back);

    const handlePatch = async () => {
        const accountService = AccountService.instance();
        if (Utils.isEmpty(form.accountName)) return;
        if (Utils.isNull(form.accountId)) return;

        const response = await accountService.doPatchAccount(form.accountId!, {
            accountName: form.accountName!,
            amount: Number(form.amount!),
            iconId: form.iconId,
        });
        if (response.kind === GeneralApiProblemKind.Ok) {
            ToastService.info({
                title: 'common:info',
                message: 'common:updateAccountSuccess',
            });
            await invalidateQuery(InvalidationGroups.account(form.accountId));
            goBackSmart();
        } else if (response.kind === GeneralApiProblemKind.BadData) {
            handleBadDataResponse(response.errors, setErrors);
        } else {
            buildGeneralApiBaseHandler(response);
        }
    };

    const handleSave = async () => {
        const isValid = await save();
        if (!isValid) return;
        await handlePatch();
    };
    const handleDelete = async () => {
        const accountService = AccountService.instance();
        if (!form.accountId) return;

        const response = await accountService.doDeleteAccount(form.accountId);
        if (response.kind === GeneralApiProblemKind.Ok) {
            ToastService.info({
                title: 'common:info',
                message: 'common:deleteAccountSuccess',
            });
            await invalidateQuery(InvalidationGroups.account(form.accountId));
            goBackSmart();
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
        return <EmptyState style={$containerStyleOverride} buttonOnPress={() => goBackSmart()} />;
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
                goBackSmart();
            }}
            onDelete={onDelete}
            handleSave={handleSave}
        />
    );
};
const $containerStyleOverride: StyleProp<ViewStyle> = {
    margin: 'auto',
};
