import { useNavigation } from '@react-navigation/native';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Utils } from 'tenpercent/shared';

import { TransactionCreate } from '@/components/transaction/TransactionCreate';
import { translate } from '@/i18n/translate';
import { ITransactionClient } from '@/interfaces/ITransactionClient';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { OverviewPath } from '@/types/OverviewPath';

type Props = NativeStackScreenProps<ParamListBase, string>;

export const TransactionCreateScreen = function TransactionsScreen(_props: Props) {
    const params = _props?.route?.params as { id: number; name: string; payload: string };
    const navigation = useNavigation();

    const data = Utils.parseObject<ITransactionClient | undefined>(params.payload);
    return (
        <GenericListScreen
            name={translate('common:new')}
            isError={false}
            isPending={false}
            props={{
                data,
            }}
            onBack={() => navigation.getParent()?.navigate(OverviewPath.Dashboard)}
            RenderComponent={TransactionCreate}
        />
    );
};
