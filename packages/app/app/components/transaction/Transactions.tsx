import { FC } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IPagination } from 'tenpercent/shared';
import { ITransactionListItem } from 'tenpercent/shared';

import { EmptyState } from '@/components/EmptyState';
import TransactionSectionList, { fetchTransactionType } from '@/components/transaction/TransactionSectionList';

interface ITransactionsPros {
    data: IPagination<ITransactionListItem> | undefined;
    fetch?: fetchTransactionType;
    onPress?: (id: number, name: string) => void;
}

export const Transactions: FC<ITransactionsPros> = function Transactions(_props) {
    const { data, fetch, onPress } = _props;
    const navigation = useNavigation();

    if (!data || data?.data?.length <= 0) {
        return <EmptyState style={$styles.containerStyleOverride} buttonOnPress={() => navigation.goBack()} />;
    }

    return (
        <>
            <TransactionSectionList onPress={onPress} transactions={data.data} fetch={fetch} />
        </>
    );
};

const $styles = StyleSheet.create({
    containerStyleOverride: {
        margin: 'auto',
    },
});
