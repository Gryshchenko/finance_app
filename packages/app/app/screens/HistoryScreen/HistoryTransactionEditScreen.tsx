import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ITransaction } from 'tenpercent/shared';
import { Utils } from 'tenpercent/shared';

import { TransactionEdit } from '@/components/transaction/TransactionEdit';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { OverviewPath } from '@/types/OverviewPath';
import { TransactionPath } from '@/types/TransactionPath';

type Props = NativeStackScreenProps<OverviewTabParamList, TransactionPath.TransactionEdit>;

export const HistoryTransactionEditScreen = function TransactionEditScreen(_props: Props) {
    const params = _props?.route?.params as { id: number; name: string; payload: string };
    const navigation = useNavigation();
    const data = Utils.parseObject<ITransaction | undefined>(params.payload);
    return (
        <GenericListScreen
            name={params?.name}
            isError={false}
            isPending={false}
            onBack={() =>
                navigation.getParent()?.navigate(OverviewPath.History, {
                    screen: TransactionPath.Transactions,
                })
            }
            props={{
                data,
            }}
            RenderComponent={TransactionEdit}
        />
    );
};
