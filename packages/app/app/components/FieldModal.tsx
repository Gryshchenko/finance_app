import { ReactNode, useState } from 'react';
import { Modal, Pressable, StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Text, TextProps } from '@/components/Text';
import { TxKeyPath } from '@/i18n';
import { colors } from '@/theme/colors';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

import {
    FieldPresets,
    $fieldPresets,
    $labelNotSelectedStyle,
    $labelSelectedStyle,
    $borderFocusStyle,
    $borderNoFocusStyle,
    $helperStyle,
} from './FieldPresets';

export type FieldModalProps = {
    /** Visual preset - must match the TextField presets for consistency. */
    preset?: FieldPresets;
    /** Whether the modal is open (controlled). If omitted the component manages its own state. */
    isOpen?: boolean;
    /** Called when the modal should open. */
    onOpen?: () => void;
    /** Called when the modal should close (backdrop press / Android back). */
    onClose?: () => void;

    /* ── trigger ── */
    /** Content rendered inside the trigger button. */
    renderTrigger: (isOpen: boolean) => ReactNode;
    /** Extra styles applied to the trigger Pressable. */
    triggerStyle?: StyleProp<ViewStyle>;

    /* ── modal content ── */
    /** i18n key for the modal header title. When provided a header bar with title and close button is rendered. */
    modalTitleTx?: TxKeyPath;
    /** Content rendered inside the bottom-sheet modal. */
    renderContent: (close: () => void) => ReactNode;
    /** Style overrides for the inner modal container. */
    modalContentStyle?: StyleProp<ViewStyle>;

    /* ── label / helper (same API as TextField) ── */
    labelTx?: TxKeyPath;
    label?: string;
    helperTx?: TxKeyPath;
    helper?: string;
    helperTxOptions?: TextProps['txOptions'];
    HelperTextProps?: TextProps;
    status?: 'error' | 'disabled';

    /* ── container ── */
    style?: StyleProp<ViewStyle>;
    disabled?: boolean;
    inputWrapperStyle?: ThemedStyle<ViewStyle>;
};

export function FieldModal({
    preset = 'default',
    isOpen: isOpenProp,
    onOpen,
    onClose,
    renderTrigger,
    triggerStyle,
    modalTitleTx,
    renderContent,
    modalContentStyle,
    labelTx,
    label,
    helperTx,
    helper,
    helperTxOptions,
    HelperTextProps,
    status,
    style,
    disabled,
    inputWrapperStyle,
}: FieldModalProps) {
    const {
        themed,
        theme: { colors: themeColors },
    } = useAppTheme();

    // support both controlled and uncontrolled mode
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = isOpenProp ?? internalOpen;

    const open = () => {
        if (disabled || status === 'disabled') return;
        setInternalOpen(true);
        onOpen?.();
    };

    const close = () => {
        setInternalOpen(false);
        onClose?.();
    };

    const presetStyles = $fieldPresets[preset];

    const $helperStyles = [$helperStyle, status === 'error' && { color: colors.error }, HelperTextProps?.style];

    const $triggers = [
        ...presetStyles.inputWrapper,
        inputWrapperStyle,
        { justifyContent: 'center' as const },
        triggerStyle,
        status === 'error' && { borderColor: colors.error },
        status !== 'error' && (isOpen ? $borderFocusStyle : $borderNoFocusStyle),
    ];

    return (
        <View style={themed([...presetStyles.container, style])}>
            {!!(label || labelTx) && (
                <Text
                    size={'xs'}
                    style={themed([...presetStyles.label, isOpen ? $labelSelectedStyle : $labelNotSelectedStyle])}
                    preset="formLabel"
                    tx={labelTx}
                    text={label}
                />
            )}

            <Pressable disabled={disabled || status === 'disabled'} style={themed($triggers)} onPress={open}>
                {renderTrigger(isOpen)}
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

            <Modal visible={isOpen} transparent animationType="slide" onRequestClose={close}>
                <Pressable style={themed($overlay)} onPress={close}>
                    <View style={[themed($modalContent), modalContentStyle]}>
                        <Pressable onPress={(e) => e.stopPropagation()}>
                            {!!modalTitleTx && (
                                <View style={themed($sheetHeader)}>
                                    <Text tx={modalTitleTx} style={themed($sheetTitle)} />
                                    <Pressable onPress={close} hitSlop={12}>
                                        <MaterialIcons name="close" size={20} color={themeColors.textDim} />
                                    </Pressable>
                                </View>
                            )}
                            {renderContent(close)}
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

/* ── Modal-specific styles (not part of field presets) ── */

const $overlay: ThemedStyle<ViewStyle> = () => ({
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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

const $modalContent: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
    width: '100%',
    maxHeight: '80%',
    marginTop: 'auto',
    backgroundColor: colors.background,
    borderTopLeftRadius: spacing.sm,
    borderTopRightRadius: spacing.sm,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    paddingBottom: spacing.lg,
});
