import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import {
    AccountIcon,
    CategoryIconType,
    HealthIcon,
    IncomeIcon,
    LeisureIcon,
    SpendIcon,
    TechIcon,
    TransportIcon,
    VIPIcon,
} from 'tenpercent/shared';

import { CategoryIcon } from '@/components/CategoryIcon';
import { iconRegistry } from '@/components/Icon';
import { Text, TextProps } from '@/components/Text';
import { TxKeyPath } from '@/i18n';
import { translate } from '@/i18n/translate';
import { colors } from '@/theme/colors';
import { useAppTheme } from '@/theme/context';
import { spacing } from '@/theme/spacing';
import { ThemedStyle } from '@/theme/types';

type IconCategory = {
    name: string;
    icons: CategoryIconType[];
};

const iconCategories: IconCategory[] = [
    { name: 'Account', icons: Object.values(AccountIcon) },
    { name: 'Income', icons: Object.values(IncomeIcon) },
    { name: 'Spend', icons: Object.values(SpendIcon) },
    { name: 'Transport', icons: Object.values(TransportIcon) },
    { name: 'Leisure', icons: Object.values(LeisureIcon) },
    { name: 'Health', icons: Object.values(HealthIcon) },
    { name: 'Tech', icons: Object.values(TechIcon) },
    { name: 'VIP', icons: Object.values(VIPIcon) },
];

type IconFieldProps = {
    value: CategoryIconType | string | undefined;
    onChange?: (icon: CategoryIconType) => void;
    labelTx?: TxKeyPath;
    label?: string;
    style?: StyleProp<ViewStyle>;
    disabled?: boolean;
    helperTx?: TxKeyPath;
    helper?: string;
    HelperTextProps?: TextProps;
    status?: 'error' | 'disabled';
    helperTxOptions?: TextProps['txOptions'];
};

export function IconField({
    value,
    onChange,
    labelTx,
    label,
    style,
    disabled,
    HelperTextProps,
    status,
    helper,
    helperTx,
    helperTxOptions,
}: IconFieldProps) {
    const [isOpen, setIsOpen] = useState(false);
    const valueInWork = iconRegistry[value as unknown as CategoryIconType] ? (value as CategoryIconType) : AccountIcon.Cash;
    const { themed, theme } = useAppTheme();

    const handleSelect = (icon: CategoryIconType) => {
        setIsOpen(false);
        onChange?.(icon);
    };

    const $helperStyles = [$helperStyle, status === 'error' && { color: colors.error }, HelperTextProps?.style];

    const $triggers = [
        themed($trigger),
        status === 'error' && { borderColor: colors.error },
        status !== 'error' && (isOpen ? themed($triggerBorderFocusStyle) : themed($triggerBorderNoFocusStyle)),
    ];

    return (
        <View style={[themed($containerStyle), style]}>
            {!!(label || labelTx) && (
                <Text size={'xs'} style={themed($labelStyle)} preset="formLabel" tx={labelTx} text={label} />
            )}
            <Pressable disabled={disabled || status === 'disabled'} style={$triggers} onPress={() => setIsOpen(true)}>
                {valueInWork ? (
                    <View style={themed($selectedIconWrapper)}>
                        <CategoryIcon name={valueInWork} size={28} color={theme.colors.text} />
                    </View>
                ) : (
                    <Text style={themed($placeholderText)}>{translate('common:icon')}</Text>
                )}
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
                        <Pressable onPress={(e) => e.stopPropagation()}>
                            <ScrollView showsVerticalScrollIndicator={false} style={{ gap: spacing.md, marginTop: spacing.lg }}>
                                {iconCategories.map((category) => (
                                    <View key={category.name} style={themed($categorySection)}>
                                        <Text style={themed($categoryTitle)}>{category.name}</Text>
                                        <View style={themed($iconGrid)}>
                                            {category.icons.map((icon) => (
                                                <Pressable
                                                    key={icon}
                                                    style={[themed($iconItem), value === icon && themed($iconItemSelected)]}
                                                    onPress={() => handleSelect(icon)}
                                                >
                                                    <CategoryIcon
                                                        name={icon}
                                                        size={28}
                                                        color={
                                                            value === icon ? theme.colors.palette.primary500 : theme.colors.text
                                                        }
                                                    />
                                                </Pressable>
                                            ))}
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const $containerStyle: ThemedStyle<ViewStyle> = () => ({
    height: 80,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
});

const $trigger: ThemedStyle<ViewStyle> = ({ colors }) => ({
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 0,
    backgroundColor: colors.background,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    height: 54,
    width: 54,
});

const $triggerBorderFocusStyle: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderColor: colors.palette.neutral900,
});

const $triggerBorderNoFocusStyle: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderColor: colors.border,
});

const $selectedIconWrapper: ThemedStyle<ViewStyle> = () => ({
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
});

const $placeholderText: ThemedStyle<TextStyle> = ({ colors }) => ({
    color: colors.textDim,
    fontSize: 12,
});

const $dropdown: ThemedStyle<ViewStyle> = ({ colors, spacing, typography }) => ({
    width: '100%',
    maxHeight: '80%',
    marginTop: 'auto',
    backgroundColor: colors.background,
    fontFamily: typography.primary.normal,
    borderTopLeftRadius: spacing.sm,
    borderTopRightRadius: spacing.sm,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    paddingBottom: spacing.lg,
});

const $categorySection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
});

const $categoryTitle: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDim,
    fontFamily: typography.primary.medium,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
});

const $iconGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
});

const $iconItem: ThemedStyle<ViewStyle> = ({ colors, border }) => ({
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: border.borderRadius,
    backgroundColor: colors.background,
});

const $iconItemSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
    backgroundColor: colors.palette.primary100,
    borderWidth: 2,
    borderColor: colors.palette.primary500,
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
    marginBottom: spacing.lg,
    marginLeft: 4,
    textTransform: 'uppercase',
    color: colors.textDim,
    fontFamily: typography.fonts.funnelSans.semiBold,
});

const $overlay: ThemedStyle<ViewStyle> = () => ({
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
});
