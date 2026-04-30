import { FC } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IIncome, Utils } from 'tenpercent/shared';

import { EmptyState } from '@/components/EmptyState';
import { IncomeFields } from '@/components/income/IncomeFields';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { translate } from '@/i18n/translate';
import { incomeEditSchema } from '@/schems/validationSchemas';
import AlertService from '@/services/AlertService';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { IncomeService } from '@/services/IncomeService';
import { InvalidationGroups } from '@/services/QueryCacheService';
import ToastService from '@/services/ToastService';
import { OverviewPath } from '@/types/OverviewPath';

interface IIncomePros {
    data: Partial<IIncome> | undefined;
}

export const IncomeEdit: FC<IIncomePros> = function IncomeEdit(_props) {
    const { data } = _props;
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();
    const { form, handleChange, save, errors, setErrors } = useEditView<Partial<IIncome>>(data!, incomeEditSchema);

    const handlePatch = async () => {
        const incomeService = IncomeService.instance();
        if (Utils.isEmpty(form.incomeName)) return;
        if (Utils.isNull(form.incomeId)) return;

        const response = await incomeService.doPatchIncome(form.incomeId!, {
            incomeName: form.incomeName!,
        });
        if (response.kind === GeneralApiProblemKind.Ok) {
            ToastService.info({
                title: 'common:info',
                message: 'common:updateAccountSuccess',
            });
            await invalidateQuery(InvalidationGroups.income(form.incomeId));
            navigation.goBack();
        } else if (response.kind === GeneralApiProblemKind.BadData) {
            handleBadDataResponse(response.errors, setErrors);
        } else {
            buildGeneralApiBaseHandler(response);
        }
    };
    const handleDelete = async () => {
        const incomeService = IncomeService.instance();
        if (!form.incomeId) return;

        const response = await incomeService.doDeleteIncome(form.incomeId);
        if (response.kind === GeneralApiProblemKind.Ok) {
            ToastService.info({
                title: 'common:info',
                message: 'common:deleteAccountSuccess',
            });
            await invalidateQuery(InvalidationGroups.income(form.incomeId));
            navigation.getParent()?.navigate(OverviewPath.Dashboard);
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
        <IncomeFields
            form={form}
            isCreate={false}
            isEdit={true}
            errors={errors}
            isView={false}
            handleChange={(key: string, value: string | number) => {
                handleChange(key as keyof IIncome, value);
            }}
            cancel={() => {
                navigation.goBack();
            }}
            onDelete={onDelete}
            handleSave={handleSave}
        />
    );
};
const $containerStyleOverride: StyleProp<ViewStyle> = {
    margin: 'auto',
};
