import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TransactionType } from 'tenpercent/shared';

import { TransactionCreate } from '@/components/transaction/TransactionCreate';
import { translate } from '@/i18n/translate';
import { ITransactionClient } from '@/interfaces/ITransactionClient';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { OverviewPath } from '@/types/OverviewPath';
import { TransactionPath } from '@/types/TransactionPath';

type Props = NativeStackScreenProps<OverviewTabParamList, TransactionPath.TransactionCreate>;

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

export const HistoryTransactionCreateScreen = function TransactionCreateScreen(_props: Props) {
    const navigation = useNavigation();
    const params = _props?.route?.params as { payload?: Partial<ITransactionClient> } | undefined;
    const payload = params?.payload;

    return (
        <GenericListScreen
            name={getScreenTitle(payload?.transactionTypeId)}
            isError={false}
            isPending={false}
            onBack={() => navigation.getParent()?.navigate(OverviewPath.Dashboard)}
            props={{
                data: payload,
            }}
            RenderComponent={TransactionCreate}
        />
    );
};
