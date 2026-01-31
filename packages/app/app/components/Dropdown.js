import { useState } from 'react';
import { View, Pressable, Modal } from 'react-native';
import { ListItem } from '@/components/ListItem';
import { Text } from '@/components/Text';
import { useAppQuery } from '@/hooks/useAppQuery';
import { translate } from '@/i18n/translate';
import SectionListWithKeyboardAwareScrollView from '@/screens/DemoShowroomScreen/SectionListWithKeyboardAwareScrollView';
import { colors } from '@/theme/colors';
import { useAppTheme } from '@/theme/context';
export function Dropdown({
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
}) {
    const { isError, data, isPending } = useAppQuery(queryKey, fetcher);
    const [isOpen, setIsOpen] = useState(false);
    const { themed } = useAppTheme();
    const selected = data?.find((item) => keyExtractor(item) === String(value));
    const filteredData = filter ? filter(data) : data;
    const handleSelect = (item) => {
        setIsOpen(false);
        onChange?.(item);
    };
    const $helperStyles = [$helperStyle, status === 'error' && { color: colors.error }, HelperTextProps?.style];
    const $inputWrapperStyles = [status === 'error' && { borderColor: colors.error }];
    const renderItem = ({ item: transaction }) => {
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
    return (
        <View style={style}>
            {labelTx && <Text size={'xs'} preset="formLabel" tx={labelTx} />}
            <Pressable
                disabled={disabled || isPending || isError}
                style={[themed($trigger), themed($inputWrapperStyles)]}
                onPress={() => setIsOpen(true)}
            >
                <Text style={themed($triggerText)}>
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
const $trigger = ({ colors, spacing }) => ({
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.xxs,
    backgroundColor: colors.background,
});
const $triggerText = ({ colors }) => ({
    fontSize: 16,
    color: colors.text,
    marginVertical: 8,
    marginHorizontal: 12,
});
const $overlay = ({ colors }) => ({
    flex: 1,
    backgroundColor: `${colors.background}AA`,
    justifyContent: 'center',
    alignItems: 'center',
});
const $dropdown = ({ colors, spacing }) => ({
    width: '100%',
    height: '90%',
    marginTop: 'auto',
    backgroundColor: colors.background,
    borderRadius: spacing.xxs,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
});
const $option = ({ spacing }) => ({
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
});
const $optionText = ({ colors }) => ({
    color: colors.text,
    fontSize: 14,
});
const $helperStyle = ({ spacing }) => ({
    marginTop: spacing.xs,
});
