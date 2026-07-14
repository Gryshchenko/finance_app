import { FC } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IAccount, Utils } from '@tenpercent/shared';

import { AccountFields } from '@/components/account/AccountFields';
import { EmptyState } from '@/components/EmptyState';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { useGoBackSmart } from '@/hooks/useGoBackSmart';
import { useHeaderRightAction } from '@/hooks/useHeaderRightAction';
import { translate } from '@/i18n/translate';
import { IAccountClient } from '@/interfaces/IAccountClient';
import { accountEditSchema } from '@/schems/validationSchemas';
import { AccountService } from '@/services/AccountService';
import AlertService from '@/services/AlertService';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { InvalidationGroups } from '@/services/QueryCacheService';
import ToastService from '@/services/ToastService';
import type { BackTarget } from '@/types/BackTarget';
import { OverviewPath } from '@/types/OverviewPath';

interface IAccountPros {
    data: Partial<IAccountClient> | undefined;
    back?: BackTarget;
}

export const AccountEdit: FC<IAccountPros> = function AccountEdit(_props) {
    const { data, back } = _props;
    const invalidateQuery = useInvalidateQuery();
    const { form, handleChange, save, errors, setErrors, withFetching, isFetching } = useEditView<Partial<IAccountClient>>(
        data!,
        accountEditSchema,
    );
    const navigation = useNavigation();
    const goBackSmart = useGoBackSmart(back);

    const handlePatch = async () => {
        await withFetching(async () => {
            const accountService = AccountService.instance();
            if (Utils.isEmpty(form.accountName)) return;
            if (Utils.isNull(form.accountId)) return;

            const response = await accountService.doPatchAccount(form.accountId!, {
                accountName: form.accountName!,
                amount: Number(form.amount!),
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                ToastService.info({
                    title: 'common:info',
                    message: 'accountScreen:updateAccountSuccess',
                });
                await invalidateQuery(InvalidationGroups.account(form.accountId));
                goBackSmart();
            } else if (response.kind === GeneralApiProblemKind.BadData) {
                handleBadDataResponse(response.errors, setErrors);
            } else {
                buildGeneralApiBaseHandler(response);
            }
        });
    };

    const handleSave = async () => {
        const isValid = await save();
        if (!isValid) return;
        await handlePatch();
    };
    const handleDelete = async (keepData: boolean) => {
        await withFetching(async () => {
            const accountService = AccountService.instance();
            if (!form.accountId) return;

            const response = await accountService.doDeleteAccount(form.accountId, { keepData });
            if (response.kind === GeneralApiProblemKind.Ok) {
                ToastService.info({
                    title: 'common:info',
                    message: 'accountScreen:deleteAccountSuccess',
                });
                await invalidateQuery(InvalidationGroups.account(form.accountId));
                navigation.getParent()?.navigate(OverviewPath.Dashboard);
            } else {
                ToastService.error({
                    title: 'common:error',
                    message: 'accountScreen:deleteAccountFailed',
                });
            }
        });
    };

    const onDelete = () => {
        AlertService.prompt(translate('accountScreen:deleteAccountTitle'), translate('accountScreen:deleteAccountMessage'), [
            { text: translate('common:keepData'), onPress: () => handleDelete(true) },
            { text: translate('common:deleteAll'), onPress: () => handleDelete(false) },
            { text: translate('common:cancel'), style: 'cancel' },
        ]);
    };

    useHeaderRightAction(data ? onDelete : undefined, { disabled: isFetching });

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
            isSaveDisabled={isFetching}
            isDeleteDisabled={isFetching}
            handleChange={(key: string, value: string | number) => {
                handleChange(key as keyof IAccount, value);
            }}
            handleSave={handleSave}
        />
    );
};
const $containerStyleOverride: StyleProp<ViewStyle> = {
    margin: 'auto',
};
