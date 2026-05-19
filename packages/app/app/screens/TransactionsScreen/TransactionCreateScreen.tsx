import { useNavigation, ParamListBase } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TransactionType } from 'tenpercent/shared';

import { TransactionCreate } from '@/components/transaction/TransactionCreate';
import { translate } from '@/i18n/translate';
import { ITransactionClient } from '@/interfaces/ITransactionClient';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { OverviewPath } from '@/types/OverviewPath';

type Props = NativeStackScreenProps<ParamListBase, string>;

const getScreenTitle = (typeId?: number): string => {
    switch (typeId) {
        case TransactionType.Expense:
            return `${translate('common:create')} ${translate('common:expense')}`;
        case TransactionType.Income:
            return `${translate('common:create')} ${translate('common:income')}`;
        case TransactionType.Transafer:
            return `${translate('common:create')} ${translate('common:transfer')}`;
        default:
            return translate('common:create');
    }
};
export const TransactionCreateScreen = function TransactionsScreen(_props: Props) {
    const navigation = useNavigation();
    const params = _props?.route?.params as { payload?: { data: Partial<ITransactionClient>; uuid: string } } | undefined;
    const data = params?.payload?.data;
    const uuid = params?.payload?.uuid;

    return (
        <GenericListScreen
            name={getScreenTitle(data?.transactionTypeId)}
            isError={false}
            isPending={false}
            onBack={() => navigation.getParent()?.navigate(OverviewPath.Dashboard)}
            props={{
                data,
                uuid,
            }}
            RenderComponent={TransactionCreate}
        />
    );
};
