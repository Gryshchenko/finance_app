import { View, ViewStyle, TextStyle, StyleProp } from 'react-native';

import { FieldModal } from '@/components/FieldModal';
import { ListItem } from '@/components/ListItem';
import SectionListWithKeyboardAwareScrollView from '@/components/SectionListWithKeyboardAwareScrollView';
import { Text, TextProps } from '@/components/Text';
import { useAppQuery } from '@/hooks/useAppQuery';
import { TxKeyPath } from '@/i18n';
import { translate } from '@/i18n/translate';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

type DropdownProps<T> = {
    queryKey: string;
    fetcher: () => Promise<T[] | undefined>;
    value?: string | number;
    onChange?: (item: T) => void;
    keyExtractor: (item: T) => string;
    labelExtractor: (item: T) => string;
    labelTx?: TxKeyPath;
    style?: StyleProp<TextStyle>;
    disabled?: boolean;
    filter?: (items: T[] | undefined) => T[];
    helperTx?: TxKeyPath;
    helper?: string;
    HelperTextProps?: TextProps;
    status?: 'error' | 'disabled';
    helperTxOptions?: TextProps['txOptions'];
};

export function Dropdown<T>({
    queryKey,
    fetcher,
    value,
    onChange,
    keyExtractor,
    labelExtractor,
    labelTx,
    style,
    disabled,
    filter,
    HelperTextProps,
    status,
    helper,
    helperTx,
    helperTxOptions,
}: DropdownProps<T>) {
    const { isError, data, isPending } = useAppQuery<T[] | undefined>(queryKey, fetcher);
    const { themed } = useAppTheme();

    const selected = data?.find((item) => keyExtractor(item) === String(value));
    const filteredData = filter ? filter(data) : data;

    const displayText = isPending
        ? `${translate('common:loading')}...`
        : isError
          ? translate('common:failedLoad')
          : selected
            ? labelExtractor(selected)
            : translate('common:selectOption');

    const sections = [
        {
            name: '',
            description: '',
            data: filteredData ?? [],
        },
    ];

    return (
        <FieldModal
            labelTx={labelTx}
            style={style}
            disabled={disabled || isPending || isError}
            status={status}
            helper={helper}
            helperTx={helperTx}
            helperTxOptions={helperTxOptions}
            HelperTextProps={HelperTextProps}
            renderTrigger={() => {
                const $triggersText = [
                    themed($triggerText),
                    selected && !isError ? themed($triggerTextSelected) : themed($triggerTextNonSelected),
                    isError && themed($errorText),
                ];
                return <Text style={$triggersText}>{displayText}</Text>;
            }}
            renderContent={(close) => {
                const handleSelect = (item: T) => {
                    close();
                    onChange?.(item);
                };

                const renderItem = ({ item: transaction }: { item: T }) => {
                    if (!transaction) return null;
                    return (
                        <ListItem
                            key={keyExtractor(transaction)}
                            disabled={false}
                            bottomSeparator
                            onPress={() => handleSelect(transaction)}
                        >
                            <View style={themed($option)}>
                                <Text style={themed($optionText)}>{labelExtractor(transaction)}</Text>
                            </View>
                        </ListItem>
                    );
                };

                return (
                    <SectionListWithKeyboardAwareScrollView
                        sections={sections}
                        keyExtractor={(item) => keyExtractor(item) ?? 'id'}
                        renderItem={renderItem}
                        stickySectionHeadersEnabled={true}
                    />
                );
            }}
        />
    );
}

/* ── Dropdown-specific styles ── */

const $triggerText: ThemedStyle<TextStyle> = ({ typography }) => ({
    flex: 1,
    alignSelf: 'stretch',
    fontFamily: typography.primary.normal,
    fontSize: 14,
    height: 54,
    paddingHorizontal: 16,
    paddingVertical: 14,
});

const $triggerTextNonSelected: ThemedStyle<TextStyle> = ({ colors }) => ({
    color: colors.textDim,
});

const $triggerTextSelected: ThemedStyle<TextStyle> = ({ colors }) => ({
    color: colors.text,
});

const $errorText: ThemedStyle<TextStyle> = ({ colors }) => ({
    color: colors.error,
});

const $option: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
});

const $optionText: ThemedStyle<TextStyle> = ({ colors }) => ({
    color: colors.text,
    fontSize: 14,
});
