import { useState } from 'react';
import { View, Pressable, Modal, ViewStyle, TextStyle, StyleProp } from 'react-native';

import { ListItem } from '@/components/ListItem';
import { Text, TextProps } from '@/components/Text';
import { useAppQuery } from '@/hooks/useAppQuery';
import { TxKeyPath } from '@/i18n';
import { translate } from '@/i18n/translate';
import SectionListWithKeyboardAwareScrollView from '@/components/SectionListWithKeyboardAwareScrollView';
import { colors } from '@/theme/colors';
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
    const [isOpen, setIsOpen] = useState(false);
    const { themed } = useAppTheme();

    const selected = data?.find((item) => keyExtractor(item) === String(value));
    const filteredData = filter ? filter(data) : data;

    const handleSelect = (item: T) => {
        setIsOpen(false);
        onChange?.(item);
    };

    const $helperStyles = [$helperStyle, status === 'error' && { color: colors.error }, HelperTextProps?.style];
    const $inputWrapperStyles = [status === 'error' && { borderColor: colors.error }];

    const renderItem = ({ item: transaction }: { item: T }) => {
        if (!transaction) return null;

        return (
            <ListItem key={keyExtractor(transaction)} disabled={false} bottomSeparator onPress={() => handleSelect(transaction)}>
                <View style={themed([$option])}>
                    <Text style={themed([$optionText])}>{labelExtractor(transaction)}</Text>
                </View>
            </ListItem>
        );
    };

    const sections = [
        {
            name: '',
            description: '',
            data: filteredData ?? [],
        },
    ];

    const $triggers = [
        themed($trigger),
        themed($inputWrapperStyles),
        status === 'error' && themed({ borderColor: colors.error }),
        status !== 'error' && (isOpen ? themed($triggerBorderFocusStyle) : themed($triggerBorderNoFocusStyle)),
    ];
    const $triggersText = [
        themed($triggerText),
        selected && !isError ? themed($triggerTextSelected) : themed($triggerTextNonSelected),
        isError && themed($errorText),
    ];
    return (
        <View style={[themed($containerStyle), style]}>
            {labelTx && <Text size={'xs'} style={themed($labelStyle)} preset="formLabel" tx={labelTx} />}
            <Pressable disabled={disabled || isPending || isError} style={$triggers} onPress={() => setIsOpen(true)}>
                <Text style={$triggersText}>
                    {isPending
                        ? `${translate('common:loading')}...`
                        : isError
                          ? translate('common:failedLoad')
                          : selected
                            ? labelExtractor(selected)
                            : translate('common:selectOption')}
                </Text>
            </Pressable>
            {!!(helper || helperTx) && (
                <Text
                    preset="formHelper"
                    text={helper}
                    tx={helperTx}
                    txOptions={helperTxOptions}
                    {...HelperTextProps}
                    style={themed($helperStyles)}
                />
            )}

            <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
                <Pressable style={themed($overlay)} onPress={() => setIsOpen(false)}>
                    <View style={themed($dropdown)}>
                        <SectionListWithKeyboardAwareScrollView
                            sections={sections}
                            keyExtractor={(item) => keyExtractor(item) ?? 'id'}
                            renderItem={renderItem}
                            stickySectionHeadersEnabled={true}
                        />
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const $containerStyle: ThemedStyle<TextStyle> = () => ({
    height: 110,
});

const $trigger: ThemedStyle<ViewStyle> = ({ colors }) => ({
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 0,
    backgroundColor: colors.palette.neutral100,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    height: 54,
});
const $triggerBorderFocusStyle: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderColor: colors.palette.neutral900,
});
const $triggerBorderNoFocusStyle: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderColor: colors.border,
});

const $triggerText: ThemedStyle<TextStyle> = ({ typography }) => ({
    flex: 1,
    alignSelf: 'stretch',
    fontFamily: typography.primary.normal,
    fontSize: 14,
    height: 54,
    // https://github.com/facebook/react-native/issues/21720#issuecomment-532642093
    paddingHorizontal: 16,
    paddingVertical: 14,
});

const $triggerTextNonSelected: ThemedStyle<TextStyle> = ({ colors }) => ({
    color: colors.textDim,
});

const $triggerTextSelected: ThemedStyle<TextStyle> = ({ colors }) => ({
    color: colors.text,
});

const $overlay: ThemedStyle<ViewStyle> = ({ colors, typography }) => ({
    flex: 1,
    backgroundColor: colors.palette.neutral100,
    fontFamily: typography.primary.normal,
    justifyContent: 'center',
    alignItems: 'center',
});

const $dropdown: ThemedStyle<ViewStyle> = ({ colors, spacing, typography }) => ({
    width: '100%',
    height: '90%',
    marginTop: 'auto',
    backgroundColor: colors.palette.neutral100,
    fontFamily: typography.primary.normal,
    borderRadius: spacing.xxs,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
});

const $option: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
});
const $errorText: ThemedStyle<TextStyle> = ({ colors }) => ({
    color: colors.error,
});

const $optionText: ThemedStyle<TextStyle> = ({ colors }) => ({
    color: colors.text,
    fontSize: 14,
});
const $helperStyle: ThemedStyle<TextStyle> = ({ typography, spacing, colors }) => ({
    fontFamily: typography.primary.normal,
    color: colors.textDim,
    marginTop: spacing.xxxs,
    fontSize: 10,
});
const $labelStyle: ThemedStyle<TextStyle> = ({ spacing, typography }) => ({
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: spacing.xxxs,
    marginLeft: 4,
    textTransform: 'uppercase',
    color: colors.textDim,
    fontFamily: typography.fonts.funnelSans.semiBold,
});
