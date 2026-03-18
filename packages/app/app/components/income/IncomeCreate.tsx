import { FC } from 'react';
import { useNavigation } from '@react-navigation/native';
import { IIncome, IncomeIcon } from 'tenpercent/shared';
import { Utils } from 'tenpercent/shared';

import { IncomeFields } from '@/components/income/IncomeFields';
import { useEditView } from '@/hooks/useEditView';
import { incomeCreateSchema } from '@/schems/validationSchemas';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { IncomeService } from '@/services/IncomeService';
import ToastService from '@/services/ToastService';

export const IncomeCreate: FC = function IncomeCreate(_props) {
    const navigation = useNavigation();
    const { form, handleChange, save, errors } = useEditView<Partial<IIncome>>(
        {
            incomeName: '',
            iconId: IncomeIcon.P2P,
            currencyId: 1,
        },
        incomeCreateSchema,
    );

    const handleCreate = async () => {
        const incomeService = IncomeService.instance();
        console.log(form);
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
            navigation.getParent()?.navigate('incomes', {
                screen: 'accounts',
            });
        } else {
            ToastService.error({
                message: 'errorCode:UNKNOWN_ERROR',
                systemMessage: `response kind: ${response.kind}, on create income with name: ${form.incomeName}, currencyId: ${form.currencyId}, iconId: ${form.iconId}`,
            });
        }
    };

    const handleSave = async () => {
        await save();
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
                navigation.getParent()?.navigate('incomes', {
                    screen: 'view',
                    params: { id: form.incomeId, name: form.incomeName },
                });
            }}
            handleSave={handleSave}
        />
    );
};
