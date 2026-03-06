import { FC } from 'react';
import { useNavigation } from '@react-navigation/native';
import { IIncome } from 'tenpercent/shared';
import { Utils } from 'tenpercent/shared';

import { IncomeFields } from '@/components/income/IncomeFields';
import { useEditView } from '@/hooks/useEditView';
import { translate } from '@/i18n/translate';
import { incomeCreateSchema } from '@/schems/validationSchemas';
import AlertService from '@/services/AlertService';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { IncomeService } from '@/services/IncomeService';

export const IncomeCreate: FC = function IncomeCreate(_props) {
    const navigation = useNavigation();
    const { form, handleChange, save, errors } = useEditView<Partial<IIncome>>(
        {
            incomeName: '',
            currencyId: 1,
        },
        incomeCreateSchema,
    );

    const handleCreate = async () => {
        const incomeService = IncomeService.instance();
        if (Utils.isEmpty(form.incomeName)) return;
        if (Utils.isNull(form.currencyId)) return;
        if (Utils.isNull(form.iconId)) return;

        const response = await incomeService.doCreateIncome({
            incomeName: form.incomeName!,
            currencyId: form.currencyId!,
            iconId: form.iconId!,
        });
        if (response.kind === GeneralApiProblemKind.Ok) {
            AlertService.info(translate('common:info'), translate('common:createAccountSuccess'));
            navigation.getParent()?.navigate('incomes', {
                screen: 'accounts',
            });
        } else {
            AlertService.error(translate('common:error'), translate('common:createAccountFailed'));
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
