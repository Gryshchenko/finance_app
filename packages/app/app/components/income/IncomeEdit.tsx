import { FC } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IIncome, Utils } from '@tenpercent/shared';

import { EmptyState } from '@/components/EmptyState';
import { IncomeFields } from '@/components/income/IncomeFields';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { useGoBackSmart } from '@/hooks/useGoBackSmart';
import { useHeaderRightAction } from '@/hooks/useHeaderRightAction';
import { translate } from '@/i18n/translate';
import { incomeEditSchema } from '@/schems/validationSchemas';
import AlertService from '@/services/AlertService';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { IncomeService } from '@/services/IncomeService';
import { InvalidationGroups } from '@/services/QueryCacheService';
import ToastService from '@/services/ToastService';
import type { BackTarget } from '@/types/BackTarget';
import { OverviewPath } from '@/types/OverviewPath';

interface IIncomePros {
    data: Partial<IIncome> | undefined;
    back?: BackTarget;
}

export const IncomeEdit: FC<IIncomePros> = function IncomeEdit(_props) {
    const { data, back } = _props;
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();
    const { form, handleChange, save, errors, setErrors, withFetching, isFetching } = useEditView<Partial<IIncome>>(
        data!,
        incomeEditSchema,
    );
    const goBackSmart = useGoBackSmart(back);

    const handlePatch = async () => {
        await withFetching(async () => {
            const incomeService = IncomeService.instance();
            if (Utils.isEmpty(form.incomeName)) return;
            if (Utils.isNull(form.incomeId)) return;

            const response = await incomeService.doPatchIncome(form.incomeId!, {
                incomeName: form.incomeName!,
                iconId: form.iconId,
            });
            if (response.kind === GeneralApiProblemKind.Ok) {
                ToastService.info({
                    title: 'common:info',
                    message: 'incomeScreen:updateIncomeSuccess',
                });
                await invalidateQuery(InvalidationGroups.income(form.incomeId));
                goBackSmart();
            } else if (response.kind === GeneralApiProblemKind.BadData) {
                handleBadDataResponse(response.errors, setErrors);
            } else {
                buildGeneralApiBaseHandler(response);
            }
        });
    };
    const handleDelete = async (keepData: boolean) => {
        await withFetching(async () => {
            const incomeService = IncomeService.instance();
            if (!form.incomeId) return;

            const response = await incomeService.doDeleteIncome(form.incomeId, { keepData });
            if (response.kind === GeneralApiProblemKind.Ok) {
                ToastService.info({
                    title: 'common:info',
                    message: 'incomeScreen:deleteIncomeSuccess',
                });
                await invalidateQuery(InvalidationGroups.income(form.incomeId));
                navigation.getParent()?.navigate(OverviewPath.Dashboard);
            } else {
                ToastService.error({
                    title: 'common:error',
                    message: 'incomeScreen:deleteIncomeFailed',
                });
            }
        });
    };

    const onDelete = () => {
        AlertService.prompt(translate('incomeScreen:deleteIncomeTitle'), translate('incomeScreen:deleteIncomeMessage'), [
            { text: translate('common:keepData'), onPress: () => handleDelete(true) },
            { text: translate('common:deleteAll'), onPress: () => handleDelete(false) },
            { text: translate('common:cancel'), style: 'cancel' },
        ]);
    };

    const handleSave = async () => {
        const isValid = await save();
        if (!isValid) return;
        await handlePatch();
    };

    useHeaderRightAction(data ? onDelete : undefined, { disabled: isFetching });

    if (!data) {
        return <EmptyState style={$containerStyleOverride} buttonOnPress={() => goBackSmart()} />;
    }

    return (
        <IncomeFields
            form={form}
            isCreate={false}
            isEdit={true}
            errors={errors}
            isView={false}
            isSaveDisabled={isFetching}
            isDeleteDisabled={isFetching}
            handleChange={(key: string, value: string | number) => {
                handleChange(key as keyof IIncome, value);
            }}
            handleSave={handleSave}
        />
    );
};
const $containerStyleOverride: StyleProp<ViewStyle> = {
    margin: 'auto',
};
