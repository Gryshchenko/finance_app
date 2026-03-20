import { ReactNode, useState } from 'react';
import { Modal, Pressable, StyleProp, TextStyle, View, ViewStyle } from 'react-native';

import { Text, TextProps } from '@/components/Text';
import { TxKeyPath } from '@/i18n';
import { colors } from '@/theme/colors';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

export type FieldModalProps = {
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
};

export function FieldModal({
    isOpen: isOpenProp,
    onOpen,
    onClose,
    renderTrigger,
    triggerStyle,
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
}: FieldModalProps) {
    const { themed } = useAppTheme();

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

    const $helperStyles = [$helperStyle, status === 'error' && { color: colors.error }, HelperTextProps?.style];

    const $triggers = [
        themed($trigger),
        triggerStyle,
        status === 'error' && { borderColor: colors.error },
        status !== 'error' && (isOpen ? themed($triggerBorderFocus) : themed($triggerBorderNoFocus)),
    ];

    return (
        <View style={[themed($container), style]}>
            {!!(label || labelTx) && (
                <Text
                    size={'xs'}
                    style={themed([$labelStyle, isOpen ? $labelSelected : $labelNotSelected])}
                    preset="formLabel"
                    tx={labelTx}
                    text={label}
                />
            )}

            <Pressable disabled={disabled || status === 'disabled'} style={$triggers} onPress={open}>
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
                        <Pressable onPress={(e) => e.stopPropagation()}>{renderContent(close)}</Pressable>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

/* ── Styles ── */

const $container: ThemedStyle<ViewStyle> = () => ({
    height: 110,
});

const $labelStyle: ThemedStyle<TextStyle> = ({ spacing, typography }) => ({
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: spacing.xxxs,
    marginLeft: 4,
    textTransform: 'uppercase',
    fontFamily: typography.fonts.funnelSans.semiBold,
});

const $labelNotSelected: ThemedStyle<TextStyle> = () => ({
    color: colors.textDim,
});

const $labelSelected: ThemedStyle<TextStyle> = () => ({
    color: colors.text,
});

const $trigger: ThemedStyle<ViewStyle> = ({ colors }) => ({
    alignItems: 'flex-start',
    justifyContent: 'center',
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

const $triggerBorderFocus: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderColor: colors.palette.neutral900,
});

const $triggerBorderNoFocus: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderColor: colors.border,
});

const $helperStyle: ThemedStyle<TextStyle> = ({ typography, spacing, colors }) => ({
    fontFamily: typography.primary.normal,
    color: colors.textDim,
    marginTop: spacing.xxxs,
    fontSize: 10,
});

const $overlay: ThemedStyle<ViewStyle> = () => ({
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
