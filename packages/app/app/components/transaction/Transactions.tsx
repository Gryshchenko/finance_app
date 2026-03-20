import { FC } from 'react';
import { TextStyle, View, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IPagination } from 'tenpercent/shared';
import { ITransactionListItem } from 'tenpercent/shared';

import { EmptyState } from '@/components/EmptyState';
import { Text } from '@/components/Text';
import TransactionSectionList, { fetchTransactionType } from '@/components/transaction/TransactionSectionList';
import { translate } from '@/i18n/translate';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

interface ITransactionsPros {
    data: IPagination<ITransactionListItem> | undefined;
    fetch?: fetchTransactionType;
    onPress?: (id: number, name: string) => void;
}

export const Transactions: FC<ITransactionsPros> = function Transactions(_props) {
    const { data, fetch, onPress } = _props;
    const navigation = useNavigation();
    const { themed } = useAppTheme();

    if (!data || data?.data?.length <= 0) {
        return <EmptyState style={themed([$containerStyleOverride])} buttonOnPress={() => navigation.goBack()} />;
    }

    return (
        <View style={themed([$container])}>
            <View style={themed([$header])}>
                <Text style={themed([$headerLabel])} text={translate('transactionScreen:recentActivity' as const)} />
            </View>

            <TransactionSectionList onPress={onPress} transactions={data.data} fetch={fetch} />
        </View>
    );
};

const $container: ThemedStyle<ViewStyle> = () => ({
    flex: 1,
    paddingHorizontal: 24,
});

const $containerStyleOverride: ThemedStyle<ViewStyle> = () => ({
    margin: 'auto',
});

const $header: ThemedStyle<ViewStyle> = ({ colors }) => ({
    alignItems: 'flex-end',
    borderBottomColor: colors.separator,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 16,
});

const $headerLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
    color: colors.textDim,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 3,
    textTransform: 'uppercase',
});
