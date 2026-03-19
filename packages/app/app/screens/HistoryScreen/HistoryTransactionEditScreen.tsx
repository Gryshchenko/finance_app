import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ITransaction } from 'tenpercent/shared';
import { Utils } from 'tenpercent/shared';

import { TransactionEdit } from '@/components/transaction/TransactionEdit';
import { translate } from '@/i18n/translate';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { GenericListScreen } from '@/screens/GenericListScreen';
import { TransactionPath } from '@/types/TransactionPath';

type Props = NativeStackScreenProps<OverviewTabParamList, TransactionPath.TransactionEdit>;

export const HistoryTransactionEditScreen = function TransactionEditScreen(_props: Props) {
    const params = _props?.route?.params as { id: number; name: string; payload: string };
    const data = Utils.parseObject<ITransaction | undefined>(params.payload);
    return (
        <GenericListScreen
            name={params?.name ?? translate('common:edit')}
            isError={false}
            isPending={false}
            onBack={undefined}
            props={{
                data,
            }}
            RenderComponent={TransactionEdit}
        />
    );
};
