import { View, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { FieldModal } from '@/components/FieldModal';
import { ListItem } from '@/components/ListItem';
import SectionListWithKeyboardAwareScrollView from '@/components/SectionListWithKeyboardAwareScrollView';
import { Text, TextProps } from '@/components/Text';
import { useAppQuery } from '@/hooks/useAppQuery';
import { TxKeyPath } from '@/i18n';
import { translate } from '@/i18n/translate';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle, type ThemedStyleArray } from '@/theme/types';

import { FieldPresets, $fieldPresets } from './FieldPresets';

type DropdownProps<T> = {
    preset?: FieldPresets;
    queryKey: string;
    fetcher: () => Promise<T[] | undefined>;
    value?: string | number;
    onChange?: (item: T) => void;
    keyExtractor: (item: T) => string;
    labelExtractor: (item: T) => string;
    labelTx?: TxKeyPath;
    /** i18n key for the modal header title */
    modalTitleTx?: TxKeyPath;
    style?: StyleProp<TextStyle>;
    disabled?: boolean;
    editable?: boolean;
    filter?: (items: T[] | undefined) => T[];
    helperTx?: TxKeyPath;
    helper?: string;
    HelperTextProps?: TextProps;
    status?: 'error' | 'disabled';
    helperTxOptions?: TextProps['txOptions'];
};

export function Dropdown<T>({
    preset = 'default',
    queryKey,
    fetcher,
    value,
    onChange,
    keyExtractor,
    labelExtractor,
    labelTx,
    modalTitleTx,
    style,
    disabled: disabledProp,
    editable,
    filter,
    HelperTextProps,
    status,
    helper,
    helperTx,
    helperTxOptions,
}: DropdownProps<T>) {
    const { isError, data, isPending } = useAppQuery<T[] | undefined>(queryKey, fetcher);
    const {
        themed,
        theme: { colors: themeColors },
    } = useAppTheme();

    const selected = data?.find((item) => keyExtractor(item) === String(value));
    const filteredData = filter ? filter(data) : data;

    const disabled = disabledProp || editable === false || status === 'disabled';
    const $inputStyles: ThemedStyleArray<TextStyle> = [themed($optionText)];
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

    const presetStyles = $fieldPresets[preset];

    return (
        <FieldModal
            preset={preset}
            labelTx={labelTx}
            modalTitleTx={modalTitleTx}
            style={style}
            disabled={disabled || isPending || isError}
            status={status}
            helper={helper}
            helperTx={helperTx}
            helperTxOptions={helperTxOptions}
            HelperTextProps={HelperTextProps}
            renderTrigger={() => {
                const $triggersText = [
                    ...presetStyles.input,
                    disabled && $triggerTextNonSelected,
                    !disabled && selected && !isError ? $triggerTextSelected : $triggerTextNonSelected,
                    isError && $errorText,
                ];
                return <Text style={themed($triggersText)}>{displayText}</Text>;
            }}
            renderContent={(close) => {
                const handleSelect = (item: T) => {
                    close();
                    onChange?.(item);
                };

                const renderItem = ({ item: transaction }: { item: T }) => {
                    if (!transaction) return null;
                    const isSelected = keyExtractor(transaction) === String(value);
                    return (
                        <ListItem
                            key={keyExtractor(transaction)}
                            disabled={false}
                            bottomSeparator
                            onPress={() => handleSelect(transaction)}
                            style={isSelected ? themed($optionSelected) : undefined}
                        >
                            <View style={themed($option)}>
                                <Text style={themed([...$inputStyles, ...(isSelected ? [$optionTextSelected] : [])])}>
                                    {labelExtractor(transaction)}
                                </Text>
                                {isSelected && <MaterialIcons name="check" size={16} color={themeColors.text} />}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
});

const $optionSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
    backgroundColor: colors.palette.neutral200,
});

const $optionText: ThemedStyle<TextStyle> = ({ colors }) => ({
    color: colors.text,
    fontSize: 14,
});

const $optionTextSelected: ThemedStyle<TextStyle> = ({ typography }) => ({
    fontFamily: typography.primary.medium,
});
