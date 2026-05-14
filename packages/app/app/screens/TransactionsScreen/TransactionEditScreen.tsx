import { ParamListBase } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ITransaction, Utils } from 'tenpercent/shared';

import { TransactionEdit } from '@/components/transaction/TransactionEdit';
import { translate } from '@/i18n/translate';
import { ITransactionClient } from '@/interfaces/ITransactionClient';
import { GenericListScreen } from '@/screens/GenericListScreen';

type Props = NativeStackScreenProps<ParamListBase, string>;

export const TransactionEditScreen = function TransactionsScreen(_props: Props) {
    const params = _props?.route?.params as { id: number; name: string; payload: string };
    const parsed = Utils.parseObject<ITransaction | undefined>(params.payload);
    const data: Partial<ITransactionClient> | undefined = parsed
        ? { ...parsed, amount: parsed.amount != null ? String(parsed.amount) : '' }
        : undefined;
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
