import { FC, useState } from 'react';
import { Modal, Pressable, ScrollView, TextStyle, View, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

export interface IMonthOption {
    /** ISO of the month start, used as the option identity. */
    monthStart: string;
    /** Human readable label, e.g. "June 2026". */
    label: string;
}

interface IProps {
    options: IMonthOption[];
    selected: string;
    onSelect: (monthStart: string) => void;
}

/**
 * Compact month selector for the categories section header: a small "vs <month>"
 * trigger that opens a bottom-sheet with the selectable comparison months.
 */
export const MonthPicker: FC<IProps> = ({ options, selected, onSelect }) => {
    const {
        themed,
        theme: { colors },
    } = useAppTheme();
    const [isOpen, setIsOpen] = useState(false);

    const selectedOption = options.find((option) => option.monthStart === selected);

    const close = () => setIsOpen(false);
    const handleSelect = (monthStart: string) => {
        close();
        onSelect(monthStart);
    };

    return (
        <>
            <Pressable style={themed($trigger)} onPress={() => setIsOpen(true)} hitSlop={8}>
                <Text text={selectedOption?.label ?? ''} style={themed($triggerText)} />
                <MaterialIcons name="arrow-drop-down" size={18} color={colors.textDim} />
            </Pressable>

            <Modal visible={isOpen} transparent animationType="slide" onRequestClose={close}>
                <Pressable style={themed($overlay)} onPress={close}>
                    <View style={themed($modalContent)}>
                        <Pressable onPress={(e) => e.stopPropagation()}>
                            <View style={themed($sheetHeader)}>
                                <Text tx={'insights:compareWith'} style={themed($sheetTitle)} />
                                <Pressable onPress={close} hitSlop={12}>
                                    <MaterialIcons name="close" size={20} color={colors.textDim} />
                                </Pressable>
                            </View>
                            <ScrollView>
                                {options.map((option) => {
                                    const isSelected = option.monthStart === selected;
                                    return (
                                        <Pressable
                                            key={option.monthStart}
                                            style={themed([$option, isSelected && $optionSelected])}
                                            onPress={() => handleSelect(option.monthStart)}
                                        >
                                            <Text
                                                text={option.label}
                                                style={themed([$optionText, isSelected && $optionTextSelected])}
                                            />
                                            {isSelected && <MaterialIcons name="check" size={16} color={colors.text} />}
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </>
    );
};

const $trigger: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
});

const $triggerText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 12,
    color: colors.textDim,
    fontFamily: typography.primary.medium,
});

const $overlay: ThemedStyle<ViewStyle> = () => ({
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
});

const $modalContent: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
    width: '100%',
    maxHeight: '70%',
    marginTop: 'auto',
    backgroundColor: colors.background,
    borderTopLeftRadius: spacing.sm,
    borderTopRightRadius: spacing.sm,
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

const $option: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
