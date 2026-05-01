import { FC } from 'react';
import { TextStyle, View, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IEntityStats, IPagination, ITransactionListItem, StatsPeriod, Time, TransactionType } from 'tenpercent/shared';

import { EmptyState } from '@/components/EmptyState';
import { Text } from '@/components/Text';
import TransactionSectionList, { fetchTransactionType } from '@/components/transaction/TransactionSectionList';
import { TransactionStatsBar } from '@/components/transaction/TransactionStatsBar';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import { GeneralApiProblemKind } from '@/services/api/apiProblem';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
import { StatsService } from '@/services/StatsService';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';
import { Logger } from '@/utils/logger/Logger';

interface ITransactionsPros {
    data: {
        transactions: IPagination<ITransactionListItem> | undefined;
        entityId: number;
        transactionType: TransactionType;
    };
    fetch?: fetchTransactionType;
    onPress?: (id: number, name: string) => void;
}
export async function fetchStats(entityId: number, type: TransactionType): Promise<IEntityStats | null> {
    try {
        const statsService = StatsService.instance();
        const response = await statsService.entityStats({
            to: Time.getISODateNowUTC() as string,
            from: Time.toMonthStart(Time.getISODateNowUTC()) as string,
            period: StatsPeriod.Month,
            entityId,
            type,
        });
        switch (response.kind) {
            case GeneralApiProblemKind.Ok: {
                return response.data as IEntityStats;
            }
            default: {
                return null;
            }
        }
    } catch (e) {
        Logger.Of('Transactions').error(`Fetch entityStats failed due reason: ${(e as { message: string }).message}`);
        return null;
    }
}

export const Transactions: FC<ITransactionsPros> = function Transactions(_props) {
    const { themed } = useAppTheme();
    const {
        data: { transactions, transactionType, entityId },
        fetch,
        onPress,
    } = _props;
    const navigation = useNavigation();
    useAppQuery<IEntityStats | null>(
        QueryKeys.entityStats(entityId, transactionType),
        async () => fetchStats(entityId, transactionType),
        {
            staleTime: QueryStaleTimes.transactions,
        },
    );

    if (!transactions || transactions?.data?.length <= 0) {
        return <EmptyState style={themed([$containerStyleOverride])} buttonOnPress={() => navigation.goBack()} />;
    }

    return (
        <View style={themed([$container])}>
            <View style={$statsBarWrapper}>
                <TransactionStatsBar />
            </View>

            <View style={themed([$header])}>
                <Text style={themed([$headerLabel])} text={translate('transactionScreen:recentActivity' as const)} />
            </View>

            <TransactionSectionList
                onPress={onPress}
                transactions={transactions.data}
                initialCursor={transactions.cursor}
                fetch={fetch}
            />
        </View>
    );
};

const $container: ThemedStyle<ViewStyle> = () => ({
    flex: 1,
    paddingHorizontal: 0,
});

const $containerStyleOverride: ThemedStyle<ViewStyle> = () => ({
    margin: 'auto',
});

const $statsBarWrapper: ViewStyle = {
    marginBottom: 24,
};

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
