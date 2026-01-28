import { forwardRef, useState } from "react"
import { SectionList, TextStyle, View, ViewStyle } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { IPagination } from "tenpercent/shared"
import { ITransactionListItem } from "tenpercent/shared"
import { TransactionType } from "tenpercent/shared"
import { Utils } from "tenpercent/shared"
import { DateFormat, Time } from "tenpercent/shared"

import { EmptyState } from "@/components/EmptyState"
import { Text } from "@/components/Text"
import { useCurrency } from "@/context/CurrencyContext"
import { TxKeyPath } from "@/i18n"
import { translate } from "@/i18n/translate"
import SectionListWithKeyboardAwareScrollView, {
  SectionType,
} from "@/components/SectionListWithKeyboardAwareScrollView"
import { useAppTheme } from "@/theme/context"
import { ThemedStyle } from "@/theme/types"
import { CurrencyUtils } from "@/utils/CurrencyUtils"
import { Logger } from "@/utils/logger/Logger"

import { ListItem } from "../ListItem"

export type fetchTransactionType = ({
  cursor,
  limit,
}: {
  cursor: number
  limit: number
}) => Promise<IPagination<ITransactionListItem> | undefined>

interface Props {
  transactions: ITransactionListItem[]
  fetch?: fetchTransactionType
  onPress?: (id: number, name: string) => void
}

const getTypeKey = (typeId: TransactionType): string => {
  switch (typeId) {
    case TransactionType.Expense:
      return "expense"
    case TransactionType.Income:
      return "income"
    case TransactionType.Transafer:
      return "transfer"
    default:
      return "unknown"
  }
}

const getFromName = (transaction: ITransactionListItem): string => {
  switch (transaction.transactionTypeId) {
    case TransactionType.Expense:
      return transaction.accountName ?? "-"
    case TransactionType.Income:
      return transaction.incomeName ?? "-"
    case TransactionType.Transafer:
      return transaction.accountName ?? "-"
    default:
      return "-"
  }
}

const getToName = (transaction: ITransactionListItem): string => {
  switch (transaction.transactionTypeId) {
    case TransactionType.Expense:
      return transaction.categoryName ?? "-"
    case TransactionType.Income:
      return transaction.accountName ?? "-"
    case TransactionType.Transafer:
      return transaction.targetAccountName ?? "-"
    default:
      return "-"
  }
}
function mergeSections<T>(a: SectionType<T>[], b: SectionType<T>[]): SectionType<T>[] {
  const map = new Map<string, SectionType<T>>()

  for (const section of a) {
    map.set(section.name, { ...section, data: [...section.data] })
  }

  for (const section of b) {
    if (map.has(section.name)) {
      const existing = map.get(section.name)!
      map.set(section.name, {
        ...existing,
        data: [...existing.data, ...section.data],
      })
    } else {
      map.set(section.name, { ...section, data: [...section.data] })
    }
  }

  return Array.from(map.values())
}
const groupByDate = (transactions: ITransactionListItem[]): SectionType<ITransactionListItem>[] => {
  const groupedByDate = transactions?.reduce((acc: Record<string, unknown[]>, tx) => {
    const date = Time.formatDate(tx.createdAt, DateFormat.YYYY_MM_DD)
    if (!acc[date]) acc[date] = []
    acc[date].push(tx)
    return acc
  }, {}) as Record<string, ITransactionListItem[]>

  return Object.entries(groupedByDate).map(([date, data]) => ({
    name: date,
    description: "",
    data,
  }))
}

const TransactionSectionList = forwardRef<SectionList<ITransactionListItem>, Props>(
  ({ transactions, fetch, onPress: onPressHandler }, ref) => {
    const defaultCursor = transactions?.[transactions?.length - 1]?.transactionId ?? 0
    const navigation = useNavigation()
    const { themed } = useAppTheme()
    const { getCurrencySymbol } = useCurrency()
    const [cursor, setCursor] = useState<number | null>(defaultCursor)
    const [sections, setSections] = useState<SectionType<ITransactionListItem>[]>(
      groupByDate(transactions),
    )
    const loadMore = async () => {
      if (Utils.isNull(cursor)) return
      if (Utils.isNull(fetch)) return

      const response = await fetch!({ cursor: cursor!, limit: 20 })
      if (!response) {
        setCursor(null)
        return
      }
      const newSections = groupByDate(response.data)

      setSections(mergeSections(sections, newSections))
      setCursor(response.cursor)
    }

    if (!transactions || transactions?.length <= 0) {
      return (
        <EmptyState
          style={themed([$containerStyleOverride])}
          buttonOnPress={() => navigation.goBack()}
        />
      )
    }

    const onPress = (transactionId: number, transactionName: string) => {
      if (Utils.isNull(transactionId)) {
        Logger.Of("TransactionSectionList").error(
          "cant redirect to transaction view transactionId is null",
        )
        return
      }
      if (onPressHandler) {
        onPressHandler(transactionId, transactionName)
      }
    }
    const renderItem = ({ item: transaction }: { item: ITransactionListItem }) => {
      if (!transaction) return null
      const { transactionId, amount, currencyId } = transaction
      const name = translate(`common:${getTypeKey(transaction.transactionTypeId)}` as TxKeyPath)
      return (
        <ListItem
          key={transactionId}
          disabled={!Utils.isNumber(transactionId as unknown as string)}
          bottomSeparator
          onPress={() => onPress(transactionId, name)}
          RightComponent={
            <Text style={themed([$center])}>
              {CurrencyUtils.formatWithDelimiter(amount, getCurrencySymbol(currencyId))}
            </Text>
          }
        >
          <View style={themed([$leftContainer])}>
            <Text style={themed([$typeLabel])}>{name}</Text>
            <Text style={themed([$flowText])} numberOfLines={1} ellipsizeMode="tail">
              {`#${transaction.transactionId} ${translate("transactionScreen:from" as TxKeyPath)}: ${getFromName(transaction)}\n${translate(
                "transactionScreen:to" as TxKeyPath,
              )}: ${getToName(transaction)}`}
            </Text>
            <Text style={themed([$description])}>
              {transaction.description?.slice(0, 15) ?? ""}
            </Text>
          </View>
        </ListItem>
      )
    }

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
          return <Text style={themed([$header])}>{section.name}</Text>
        }}
      />
    )
  },
)

export default TransactionSectionList

export const $center: ThemedStyle<ViewStyle> = () => ({
  alignContent: "center",
  alignItems: "center",
  display: "flex",
  height: "100%",
})

export const $containerStyleOverride: ThemedStyle<ViewStyle> = () => ({
  margin: "auto",
})

export const $description: ThemedStyle<TextStyle> = (theme) => ({
  fontSize: 13,
  color: theme.colors.textDim,
})

export const $flowText: ThemedStyle<TextStyle> = () => ({
  fontSize: 13,
  lineHeight: 18,
})

export const $header: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  display: "flex",
  justifyContent: "center",
  paddingBottom: 10,
  paddingTop: 10,
})

export const $leftContainer: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "column",
})

export const $typeLabel: ThemedStyle<TextStyle> = (theme) => ({
  fontSize: 14,
  fontWeight: "600",
  marginBottom: 2,
  color: theme.colors.text,
  textTransform: "capitalize",
})
