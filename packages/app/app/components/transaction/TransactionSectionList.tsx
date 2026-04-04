import { forwardRef, useState } from 'react';
import { Pressable, SectionList, TextStyle, View, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AccountIcon, IPagination } from 'tenpercent/shared';
import { ITransactionListItem } from 'tenpercent/shared';
import { TransactionType } from 'tenpercent/shared';
import { Utils } from 'tenpercent/shared';
import { DateFormat, Time } from 'tenpercent/shared';

import { CategoryIcon } from '@/components/CategoryIcon';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import SectionListWithKeyboardAwareScrollView, { SectionType } from '@/components/SectionListWithKeyboardAwareScrollView';
import { Text } from '@/components/Text';
import { useCurrency } from '@/context/CurrencyContext';
import { TxKeyPath } from '@/i18n';
import { translate } from '@/i18n/translate';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';
import { CurrencyUtils } from '@/utils/CurrencyUtils';
import { Logger } from '@/utils/logger/Logger';

export type fetchTransactionType = ({
    cursor,
    limit,
}: {
    cursor: number;
    limit: number;
}) => Promise<IPagination<ITransactionListItem> | undefined>;

interface Props {
    transactions: ITransactionListItem[];
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
        return Time.formatDate(createdAt, DateFormat.TIME_ONLY);
    } catch {
        return '';
    }
};

const isIncome = (typeId: TransactionType): boolean => typeId === TransactionType.Income;

const formatAmount = (amount: number, typeId: TransactionType, currencySymbol: string): string => {
    const formatted = CurrencyUtils.formatWithDelimiter(Math.abs(amount), currencySymbol);
    if (isIncome(typeId)) return `+${formatted}`;
    return `-${formatted}`;
};

const formatSectionDate = (dateStr: string): string => {
    try {
        return Time.formatDate(dateStr, DateFormat.SHORT_WITH_TIME).split(' ').slice(0, 2).join(' ');
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
        const date = Time.formatDate(tx.createdAt, DateFormat.YYYY_MM_DD);
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
    ({ transactions, fetch, onPress: onPressHandler }, ref) => {
        const defaultCursor = transactions?.[transactions?.length - 1]?.transactionId ?? 0;
        const navigation = useNavigation();
        const { themed } = useAppTheme();
        const { getCurrencySymbol } = useCurrency();
        const [cursor, setCursor] = useState<number | null>(defaultCursor);
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
            return <EmptyState style={themed([$containerStyleOverride])} buttonOnPress={() => navigation.goBack()} />;
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

        const renderItem = ({ item: transaction }: { item: ITransactionListItem }) => {
            if (!transaction) return null;
            const { transactionId, amount, currencyId, transactionTypeId, createdAt } = transaction;
            const label = getTransactionLabel(transaction);
            const category = getSubtitleCategory(transaction);
            const time = getFormattedTime(createdAt);
            const incomeType = isIncome(transactionTypeId);
            const amountText = formatAmount(amount, transactionTypeId, getCurrencySymbol(currencyId));

            return (
                <Pressable
                    key={transactionId}
                    disabled={!Utils.isNumber(transactionId as unknown as string)}
                    onPress={() => onPress(transactionId, label)}
                    style={themed([$card])}
                >
                    <View style={themed([$cardContent])}>
                        {/* Icon circle */}
                        <View style={themed([$iconCircle, incomeType && $iconCircleIncome])}>
                            <CategoryIcon name={AccountIcon.Wallet} size={20} color={incomeType ? '#27ae60' : '#1a1a1a'} />
                        </View>

                        {/* Name + subtitle */}
                        <View style={$labelContainer}>
                            <Text style={themed([$transactionName])} numberOfLines={1} ellipsizeMode="tail">
                                {label}
                            </Text>
                            <View style={$subtitleRow}>
                                <Text style={themed([$subtitleText])}>{category}</Text>
                                {time ? (
                                    <>
                                        <View style={themed([$dot])} />
                                        <Text style={themed([$subtitleText])}>{time}</Text>
                                    </>
                                ) : null}
                            </View>
                        </View>

                        {/* Amount + chevron */}
                        <View style={$amountContainer}>
                            <Text style={themed([$amountText, incomeType && $amountIncome])}>{amountText}</Text>
                            <Icon icon={'caretRight'} size={16} color="#888888" />
                        </View>
                    </View>
                </Pressable>
            );
        };

        return (
            <SectionListWithKeyboardAwareScrollView
                ref={ref}
                onEndReached={() => loadMore()}
                sections={sections}
                keyExtractor={(item) => String(item.transactionId)}
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

/* ── Section header: centered date with horizontal lines ── */

const $sectionHeader: ThemedStyle<ViewStyle> = ({ colors }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
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
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.separator,
    padding: 15,
    marginBottom: 8,
});

const $cardContent: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
};

const $iconCircle: ThemedStyle<ViewStyle> = ({ colors }) => ({
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
});

const $iconCircleIncome: ThemedStyle<ViewStyle> = ({ colors }) => ({
    backgroundColor: colors.background,
});

const $labelContainer: ViewStyle = {
    flex: 1,
    flexDirection: 'column',
};

const $transactionName: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 16,
    fontFamily: typography.fonts.funnelSans.bold,
    color: colors.text,
});

const $subtitleRow: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
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

const $amountContainer: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
};

const $amountText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 18,
    fontFamily: typography.fonts.funnelSans.bold,
    color: colors.text,
});

const $amountIncome: ThemedStyle<TextStyle> = () => ({
    color: '#27ae60',
});
