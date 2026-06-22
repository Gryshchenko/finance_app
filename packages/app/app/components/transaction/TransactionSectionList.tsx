import { forwardRef, useState } from 'react';
import { Pressable, SectionList, TextStyle, View, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IPagination, ITransactionListItem, TransactionType, Utils, DateFormat, Time } from 'tenpercent/shared';

import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import SectionListWithKeyboardAwareScrollView, { SectionType } from '@/components/SectionListWithKeyboardAwareScrollView';
import { Text } from '@/components/Text';
import { useCurrency } from '@/context/CurrencyContext';
import { TxKeyPath } from '@/i18n';
import { translate } from '@/i18n/translate';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';
import { OverviewPath } from '@/types/OverviewPath';
import { CurrencyUtils } from '@/utils/CurrencyUtils';
import { Logger } from '@/utils/logger/Logger';

export type fetchTransactionType = ({
    cursor,
    limit,
}: {
    cursor: string | null;
    limit: number;
}) => Promise<IPagination<ITransactionListItem> | undefined>;

interface Props {
    transactions: ITransactionListItem[];
    initialCursor?: string | null;
    fetch?: fetchTransactionType;
    onPress?: (id: number, name: string) => void;
}

const getTypeKey = (typeId: TransactionType): string => {
    switch (typeId) {
        case TransactionType.Expense:
            return 'expense';
        case TransactionType.Income:
            return 'income';
        case TransactionType.Transafer:
            return 'transfer';
        default:
            return 'unknown';
    }
};

const getTransactionLabel = (transaction: ITransactionListItem): string => {
    switch (transaction.transactionTypeId) {
        case TransactionType.Expense:
            return transaction.categoryName ?? transaction.description ?? '-';
        case TransactionType.Income:
            return transaction.incomeName ?? transaction.description ?? '-';
        case TransactionType.Transafer:
            return transaction.accountName ?? transaction.description ?? '-';
        default:
            return transaction.description ?? '-';
    }
};

const getSubtitleCategory = (transaction: ITransactionListItem): string => {
    return translate(`common:${getTypeKey(transaction.transactionTypeId)}` as TxKeyPath);
};

const getFormattedTime = (createdAt: string): string => {
    try {
        return Time.formatLocalDate(createdAt, DateFormat.TIME_ONLY);
    } catch {
        return '';
    }
};

const formatSectionDate = (dateStr: string): string => {
    try {
        return Time.formatUTCDate(dateStr, DateFormat.SHORT_WITH_TIME).split(' ').slice(0, 2).join(' ');
    } catch {
        return dateStr;
    }
};

function mergeSections<T>(a: SectionType<T>[], b: SectionType<T>[]): SectionType<T>[] {
    const map = new Map<string, SectionType<T>>();

    for (const section of a) {
        map.set(section.name, { ...section, data: [...section.data] });
    }

    for (const section of b) {
        if (map.has(section.name)) {
            const existing = map.get(section.name)!;
            map.set(section.name, {
                ...existing,
                data: [...existing.data, ...section.data],
            });
        } else {
            map.set(section.name, { ...section, data: [...section.data] });
        }
    }

    return Array.from(map.values());
}

const groupByDate = (transactions: ITransactionListItem[]): SectionType<ITransactionListItem>[] => {
    const groupedByDate = transactions?.reduce((acc: Record<string, unknown[]>, tx) => {
        const date = Time.formatUTCDate(tx.createdAt, DateFormat.YYYY_MM_DD);
        if (!acc[date]) acc[date] = [];
        acc[date].push(tx);
        return acc;
    }, {}) as Record<string, ITransactionListItem[]>;

    return Object.entries(groupedByDate).map(([date, data]) => ({
        name: date,
        description: '',
        data,
    }));
};

const TransactionSectionList = forwardRef<SectionList<ITransactionListItem>, Props>(
    ({ transactions, initialCursor, fetch, onPress: onPressHandler }, ref) => {
        const navigation = useNavigation();
        const { themed } = useAppTheme();
        const { getCurrencySymbol } = useCurrency();
        const [cursor, setCursor] = useState<string | null>(initialCursor ?? null);
        const [sections, setSections] = useState<SectionType<ITransactionListItem>[]>(groupByDate(transactions));

        const loadMore = async () => {
            if (Utils.isNull(cursor)) return;
            if (Utils.isNull(fetch)) return;

            const response = await fetch!({ cursor: cursor!, limit: 20 });
            if (!response) {
                setCursor(null);
                return;
            }
            const newSections = groupByDate(response.data);
            setSections(mergeSections(sections, newSections));
            setCursor(response.cursor);
        };

        if (!transactions || transactions?.length <= 0) {
            return (
                <EmptyState
                    style={themed([$containerStyleOverride])}
                    buttonOnPress={() => navigation.getParent()?.navigate(OverviewPath.Dashboard)}
                />
            );
        }

        const onPress = (transactionId: number, transactionName: string) => {
            if (Utils.isNull(transactionId)) {
                Logger.Of('TransactionSectionList').error('cant redirect to transaction view transactionId is null');
                return;
            }
            if (onPressHandler) {
                onPressHandler(transactionId, transactionName);
            }
        };

        const getItemSides = (transaction: ITransactionListItem) => {
            const { amount, currencyCode, targetAmount, targetCurrencyCode, transactionTypeId } = transaction;
            const fromAmount = CurrencyUtils.formatWithDelimiter(Math.abs(amount), getCurrencySymbol(currencyCode));
            const toAmt = CurrencyUtils.formatWithDelimiter(
                Math.abs(targetAmount ?? 0),
                getCurrencySymbol(targetCurrencyCode ?? currencyCode),
            );
            switch (transactionTypeId) {
                case TransactionType.Expense:
                    return {
                        fromLabel: transaction.accountName ?? '-',
                        fromAmount: `-${fromAmount}`,
                        fromAmountStyle: $transferAmountFrom,
                        toLabel: transaction.categoryName ?? '-',
                        toAmount: `+${toAmt}`,
                        toAmountStyle: $transferAmountTo,
                    };
                case TransactionType.Income:
                    return {
                        fromAmountStyle: $transferAmountFrom,
                        fromAmount: `-${fromAmount}`,
                        fromLabel: transaction.incomeName ?? '-',
                        toLabel: transaction.accountName ?? '-',
                        toAmount: `+${toAmt}`,
                        toAmountStyle: $transferAmountTo,
                    };
                case TransactionType.Transafer: {
                    return {
                        fromLabel: transaction.accountName ?? '-',
                        fromAmount: `-${fromAmount}`,
                        fromAmountStyle: $transferAmountFrom,
                        toLabel: transaction.targetAccountName ?? '-',
                        toAmount: Utils.isNotNull(targetAmount) ? `+${toAmt}` : '-',
                        toAmountStyle: Utils.isNotNull(targetAmount) ? $transferAmountTo : undefined,
                    };
                }
                default:
                    return { fromLabel: '-', toLabel: '-' };
            }
        };

        const renderItem = ({ item: transaction }: { item: ITransactionListItem }) => {
            if (!transaction) return null;
            const { transactionId, createdAt } = transaction;
            const label = getTransactionLabel(transaction);
            const category = getSubtitleCategory(transaction);
            const time = getFormattedTime(createdAt);
            const sides = getItemSides(transaction);

            return (
                <Pressable
                    key={transactionId}
                    disabled={!Utils.isNumber(transactionId as unknown as string)}
                    onPress={() => onPress(transactionId, label)}
                    style={themed([$card])}
                >
                    <View style={$transferRow}>
                        <View style={$transferSide}>
                            <Text style={themed([$transferDirectionLabel])}>{translate('transactionScreen:from')}</Text>
                            <View style={$nameAmountRow}>
                                <Text style={themed([$transactionName])} numberOfLines={1} ellipsizeMode="tail">
                                    {sides.fromLabel}
                                </Text>
                                {sides.fromAmount ? (
                                    <Text style={themed([sides.fromAmountStyle!])}>{sides.fromAmount}</Text>
                                ) : null}
                            </View>
                        </View>

                        <Icon icon={'caretRight'} size={14} color="#888888" />

                        <View style={$transferSide}>
                            <Text style={themed([$transferDirectionLabel])}>{translate('transactionScreen:to')}</Text>
                            <View style={$nameAmountRow}>
                                <Text style={themed([$transactionName])} numberOfLines={1} ellipsizeMode="tail">
                                    {sides.toLabel}
                                </Text>
                                {sides.toAmount ? <Text style={themed([sides.toAmountStyle!])}>{sides.toAmount}</Text> : null}
                            </View>
                        </View>
                    </View>

                    <View style={$subtitleRow}>
                        <Text style={themed([$subtitleText])}>{category}</Text>
                        {time ? (
                            <>
                                <View style={themed([$dot])} />
                                <Text style={themed([$subtitleText])}>{time}</Text>
                            </>
                        ) : null}
                    </View>
                </Pressable>
            );
        };

        return (
            <SectionListWithKeyboardAwareScrollView
                ref={ref}
                onEndReached={() => loadMore()}
                sections={sections}
                keyExtractor={(item) => {
                    return String(item.transactionId);
                }}
                renderItem={renderItem}
                stickySectionHeadersEnabled={true}
                onEndReachedThreshold={0.5}
                renderSectionHeader={({ section }) => {
                    const dateLabel = formatSectionDate(`${section.name}T00:00:00`);
                    return (
                        <View style={themed([$sectionHeader])}>
                            <View style={themed([$sectionLine])} />
                            <Text style={themed([$sectionHeaderText])}>{dateLabel}</Text>
                            <View style={themed([$sectionLine])} />
                        </View>
                    );
                }}
            />
        );
    },
);

TransactionSectionList.displayName = 'TransactionSectionList';

export default TransactionSectionList;

export const $containerStyleOverride: ThemedStyle<ViewStyle> = () => ({
    margin: 'auto',
});

const $sectionHeader: ThemedStyle<ViewStyle> = ({ colors }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 0,
    paddingBottom: 12,
    backgroundColor: colors.background,
});

const $sectionLine: ThemedStyle<ViewStyle> = ({ colors }) => ({
    flex: 1,
    height: 1,
    backgroundColor: colors.separator,
});

const $sectionHeaderText: ThemedStyle<TextStyle> = ({ colors }) => ({
    fontSize: 11,
    fontWeight: '500',
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
});

/* ── Transaction card ── */

const $card: ThemedStyle<ViewStyle> = ({ colors }) => ({
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.separator,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
});

const $transactionName: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 14,
    fontFamily: typography.fonts.funnelSans.bold,
    color: colors.text,
    flexShrink: 1,
});

const $subtitleRow: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
};

const $subtitleText: ThemedStyle<TextStyle> = ({ colors }) => ({
    fontSize: 11,
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
});

const $dot: ThemedStyle<ViewStyle> = ({ colors }) => ({
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textDim,
});

const $transferRow: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
};

const $transferSide: ViewStyle = {
    flex: 1,
};

const $nameAmountRow: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
};

const $transferDirectionLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
    fontSize: 10,
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 1,
});

const $transferAmountFrom: ThemedStyle<TextStyle> = ({ colors }) => ({
    fontSize: 13,
    color: colors.error,
});

const $transferAmountTo: ThemedStyle<TextStyle> = () => ({
    fontSize: 13,
    color: '#27ae60',
    marginTop: 2,
});
