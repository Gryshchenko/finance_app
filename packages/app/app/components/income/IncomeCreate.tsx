import { FC, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { IIncome, IncomeIcon, Utils } from '@tenpercent/shared';

import { IncomeFields } from '@/components/income/IncomeFields';
import { useCurrency } from '@/context/CurrencyContext';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { buildIncomeCreateSchema } from '@/schems/validationSchemas';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind, handleBadDataResponse } from '@/services/api/apiProblem';
import { IncomeService } from '@/services/IncomeService';
import { InvalidationGroups } from '@/services/QueryCacheService';
import ToastService from '@/services/ToastService';
import { OverviewPath } from '@/types/OverviewPath';

export const IncomeCreate: FC = function IncomeCreate(_props) {
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();
    const { currencies } = useCurrency();
    const incomeCreateSchema = useMemo(() => buildIncomeCreateSchema(Array.from(currencies.keys())), [currencies]);
    const { form, handleChange, save, errors, setErrors, withFetching, isFetching } = useEditView<Partial<IIncome>>(
        {
            incomeName: '',
            iconId: IncomeIcon.P2P,
            currencyCode: 'USD',
        },
        incomeCreateSchema,
    );

    const handleCreate = async () => {
        await withFetching(async () => {
            const incomeService = IncomeService.instance();
            if (Utils.isEmpty(form.incomeName) || Utils.isNull(form.currencyCode) || Utils.isNull(form.iconId)) {
                ToastService.error({
                    message: 'errorCode:UNKNOWN_ERROR',
                    systemMessage: `Validation error on create income, incomeName: ${form.incomeName}, currencyCode: ${form.currencyCode}, iconId: ${form.iconId}`,
                });
                return;
            }

            const response = await incomeService.doCreateIncome({
                incomeName: form.incomeName!,
                currencyCode: form.currencyCode!,
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
        });
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
            isSaveDisabled={isFetching}
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
