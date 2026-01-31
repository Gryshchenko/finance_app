import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { TransactionCreate } from '@/components/transaction/TransactionCreate';
import { translate } from '@/i18n/translate';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { OverviewPath } from '@/types/OverviewPath';
import { TransactionPath } from '@/types/TransactionPath';

type Props = NativeStackScreenProps<OverviewTabParamList, TransactionPath.TransactionCreate>;

export const HistoryTransactionCreateScreen = function TransactionCreateScreen(_props: Props) {
    const navigation = useNavigation();
    return (
        <GenericListScreen
            name={translate('common:new')}
            isError={false}
            isPending={false}
            onBack={() =>
                navigation.getParent()?.navigate(OverviewPath.History, {
                    screen: TransactionPath.Transactions,
                })
            }
            props={{
                data: undefined,
            }}
            RenderComponent={TransactionCreate}
        />
    );
};
