import { FC } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IIncome } from 'tenpercent/shared';
import { Utils } from 'tenpercent/shared';

import { EmptyState } from '@/components/EmptyState';
import { IncomeFields } from '@/components/income/IncomeFields';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { IncomePath } from '@/navigators/IncomesStackNavigator';
import { incomeEditSchema } from '@/schems/validationSchemas';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { IncomeService } from '@/services/IncomeService';
import ToastService from '@/services/ToastService';
import { OverviewPath } from '@/types/OverviewPath';

interface IIncomePros {
    data: Partial<IIncome> | undefined;
}

export const IncomeEdit: FC<IIncomePros> = function IncomeEdit(_props) {
    const { data } = _props;
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();
    const { form, handleChange, save, errors } = useEditView<Partial<IIncome>>(data!, incomeEditSchema);

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
            await invalidateQuery([['incomes']]);
            await invalidateQuery([['income', form.incomeId]]);
            navigation.getParent()?.navigate(OverviewPath.Dashboard);
        } else {
            ToastService.error({
                title: 'common:error',
                message: 'common:updateAccountFailed',
            });
        }
    };

    const handleSave = async () => {
        await save();
        await handlePatch();
    };
    if (!data) {
        return <EmptyState style={$containerStyleOverride} buttonOnPress={() => navigation.goBack()} />;
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
                navigation.getParent()?.navigate(OverviewPath.Incomes, {
                    screen: IncomePath.IncomeView,
                    params: { id: form.incomeId, name: form.incomeName },
                });
            }}
            handleSave={handleSave}
        />
    );
};
const $containerStyleOverride: StyleProp<ViewStyle> = {
    margin: 'auto',
};
