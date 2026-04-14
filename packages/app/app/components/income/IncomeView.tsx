import { FC } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IIncome, Utils } from 'tenpercent/shared';

import { EmptyState } from '@/components/EmptyState';
import { IncomeFields } from '@/components/income/IncomeFields';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { translate } from '@/i18n/translate';
import { IncomePath } from '@/navigators/IncomesStackNavigator';
import AlertService from '@/services/AlertService';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { IncomeService } from '@/services/IncomeService';
import { InvalidationGroups } from '@/services/QueryCacheService';
import ToastService from '@/services/ToastService';
import { OverviewPath } from '@/types/OverviewPath';

interface IIncomePros {
    data: IIncome | undefined;
}

export const IncomeView: FC<IIncomePros> = function IncomeView(_props) {
    const { data } = _props;
    const navigation = useNavigation();
    const invalidateQuery = useInvalidateQuery();
    const { form } = useEditView<IIncome>(data!);

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

    if (!data) {
        return <EmptyState style={$containerStyleOverride} buttonOnPress={() => navigation.goBack()} />;
    }

    return (
        <IncomeFields
            isCreate={false}
            form={form}
            isView={true}
            isEdit={false}
            edit={() => {
                navigation.getParent()?.navigate(OverviewPath.Incomes, {
                    screen: IncomePath.IncomeEdit,
                    params: {
                        id: form.incomeId,
                        name: form.incomeName,
                        payload: Utils.objectToString(form),
                    },
                });
            }}
            onDelete={onDelete}
        />
    );
};
const $containerStyleOverride: StyleProp<ViewStyle> = {
    margin: 'auto',
};
