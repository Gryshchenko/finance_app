import { FC } from 'react';
import { useNavigation } from '@react-navigation/native';
import { IIncome, IncomeIcon, Utils } from 'tenpercent/shared';

import { IncomeFields } from '@/components/income/IncomeFields';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { incomeCreateSchema } from '@/schems/validationSchemas';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { IncomeService } from '@/services/IncomeService';
import { InvalidationGroups } from '@/services/QueryCacheService';
import ToastService from '@/services/ToastService';
import { OverviewPath } from '@/types/OverviewPath';

export const IncomeCreate: FC = function IncomeCreate(_props) {
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();
    const { form, handleChange, save, errors, setErrors } = useEditView<Partial<IIncome>>(
        {
            incomeName: '',
            iconId: IncomeIcon.P2P,
            currencyId: 1,
        },
        incomeCreateSchema,
    );

    const handleCreate = async () => {
        const incomeService = IncomeService.instance();
        if (Utils.isEmpty(form.incomeName) || Utils.isNull(form.currencyId) || Utils.isNull(form.iconId)) {
            ToastService.error({
                message: 'errorCode:UNKNOWN_ERROR',
                systemMessage: `Validation error on create income, incomeName: ${form.incomeName}, currencyId: ${form.currencyId}, iconId: ${form.iconId}`,
            });
            return;
        }

        const response = await incomeService.doCreateIncome({
            incomeName: form.incomeName!,
            currencyId: form.currencyId!,
            iconId: form.iconId!,
        });
        if (response.kind === GeneralApiProblemKind.Ok) {
            await invalidateQuery(InvalidationGroups.income());
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
        <IncomeFields
            form={form}
            isCreate={true}
            errors={errors}
            isView={false}
            isEdit={true}
            handleChange={(key: string, value: string | number) => {
                handleChange(key as keyof IIncome, value);
            }}
            cancel={() => {
                navigation.getParent()?.navigate(OverviewPath.Dashboard);
            }}
            handleSave={handleSave}
        />
    );
};
