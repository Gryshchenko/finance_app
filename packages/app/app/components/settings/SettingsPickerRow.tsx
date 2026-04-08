import { useState } from 'react';
import { FlatList, Modal, Pressable, View, ViewStyle, TextStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Text } from '@/components/Text';
import { TxKeyPath } from '@/i18n/index';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';

export interface SettingsPickerRowProps<T> {
    /** i18n key for the left label */
    labelTx: TxKeyPath;
    /** i18n key for the picker modal header */
    modalTitleTx: TxKeyPath;
    /** Available options to pick from */
    data: T[];
    /** Key of the currently selected item */
    value: string | undefined;
    /** Human-readable text for the currently selected item */
    displayValue: string | undefined;
    /** Returns the unique key for an item */
    keyExtractor: (item: T) => string;
    /** Returns the display label for an item */
    labelExtractor: (item: T) => string;
    /** Called when a new item is selected */
    onChange: (item: T) => void;
    /** Disable the row while an async operation is in flight */
    disabled?: boolean;
    /** When false, renders a bottom border divider (default: false) */
    isLast?: boolean;
}

export function SettingsPickerRow<T>({
    labelTx,
    modalTitleTx,
    data,
    value,
    displayValue,
    keyExtractor,
    labelExtractor,
    onChange,
    disabled = false,
    isLast = false,
}: SettingsPickerRowProps<T>) {
    const {
        themed,
        theme: { colors },
    } = useAppTheme();

    const [isOpen, setIsOpen] = useState(false);

    function handleSelect(item: T) {
        onChange(item);
        setIsOpen(false);
    }

    return (
        <>
            <Pressable disabled={disabled} onPress={() => setIsOpen(true)} style={[themed($row), !isLast && themed($rowBorder)]}>
                <Text tx={labelTx} style={themed($label)} />
                <View style={$rightSlot}>
                    {displayValue ? <Text text={displayValue} style={themed($value)} /> : null}
                    <MaterialIcons name="expand-more" size={18} color={colors.textDim} />
                </View>
            </Pressable>

            <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
                <Pressable style={themed($overlay)} onPress={() => setIsOpen(false)}>
                    <View style={themed($sheet)}>
                        <Pressable onPress={(e) => e.stopPropagation()}>
                            {/* Modal header */}
                            <View style={themed($sheetHeader)}>
                                <Text tx={modalTitleTx} style={themed($sheetTitle)} />
                                <Pressable onPress={() => setIsOpen(false)} hitSlop={12}>
                                    <MaterialIcons name="close" size={20} color={colors.textDim} />
                                </Pressable>
                            </View>

                            {/* Options list */}
                            <FlatList
                                data={data}
                                keyExtractor={keyExtractor}
                                renderItem={({ item }) => {
                                    const key = keyExtractor(item);
                                    const isSelected = key === value;
                                    return (
                                        <Pressable
                                            onPress={() => handleSelect(item)}
                                            style={[themed($option), isSelected && themed($optionSelected)]}
                                        >
                                            <Text
                                                text={labelExtractor(item)}
                                                style={[themed($optionText), isSelected && themed($optionTextSelected)]}
                                            />
                                            {isSelected && <MaterialIcons name="check" size={16} color={colors.text} />}
                                        </Pressable>
                                    );
                                }}
                                style={$list}
                            />
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}

/* ── Row styles (mirror SettingsRow) ── */

const $row: ThemedStyle<ViewStyle> = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
});

const $rowBorder: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
});

const $label: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    fontFamily: typography.primary.medium,
});

const $value: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 14,
    color: colors.textDim,
    fontFamily: typography.primary.normal,
    marginRight: 6,
});

const $rightSlot: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
};

/* ── Modal styles ── */

const $overlay: ThemedStyle<ViewStyle> = () => ({
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
});

const $sheet: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
    width: '100%',
    maxHeight: '70%',
    backgroundColor: colors.background,
    overflow: 'hidden',
    paddingBottom: spacing.lg,
});

const $sheetHeader: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
});

const $sheetTitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontFamily: typography.primary.semiBold,
});

const $option: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 0,
});

const $optionSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
    backgroundColor: colors.palette.neutral200,
});

const $optionText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 14,
    color: colors.text,
    fontFamily: typography.primary.normal,
});

const $optionTextSelected: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontFamily: typography.primary.medium,
    color: colors.text,
});

const $list: ViewStyle = {
    maxHeight: 400,
};
