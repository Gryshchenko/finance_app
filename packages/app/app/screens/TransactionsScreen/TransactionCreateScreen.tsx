import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ITransaction } from 'tenpercent/shared';
import { Utils } from 'tenpercent/shared';

import { TransactionCreate } from '@/components/transaction/TransactionCreate';
import { translate } from '@/i18n/translate';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { TransactionPath } from '@/types/TransactionPath';

type Props = NativeStackScreenProps<OverviewTabParamList, TransactionPath.TransactionCreate>;

export const TransactionCreateScreen = function TransactionsScreen(_props: Props) {
    const params = _props?.route?.params as { id: number; name: string; payload: string };
    const navigation = useNavigation();

    const data = Utils.parseObject<ITransaction | undefined>(params.payload);
    return (
        <GenericListScreen
            name={translate('common:new')}
            isError={false}
            isPending={false}
            props={{
                data,
            }}
            onBack={() => navigation.goBack()}
            RenderComponent={TransactionCreate}
        />
    );
};
