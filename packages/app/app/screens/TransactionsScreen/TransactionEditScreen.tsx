import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ITransaction } from 'tenpercent/shared';
import { Utils } from 'tenpercent/shared';

import { TransactionEdit } from '@/components/transaction/TransactionEdit';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { TransactionPath } from '@/types/TransactionPath';

type Props = NativeStackScreenProps<OverviewTabParamList, TransactionPath.TransactionEdit>;

export const TransactionEditScreen = function TransactionsScreen(_props: Props) {
    const params = _props?.route?.params as { id: number; name: string; payload: string };
    const { name } = params;
    const navigation = useNavigation();

    const data = Utils.parseObject<ITransaction | undefined>(params.payload);
    return (
        <GenericListScreen
            name={name}
            isError={false}
            isPending={false}
            props={{
                data,
            }}
            onBack={() => navigation.goBack()}
            RenderComponent={TransactionEdit}
        />
    );
};
