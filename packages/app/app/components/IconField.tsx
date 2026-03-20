import { ScrollView, StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import { Pressable } from 'react-native';
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
import { FieldModal } from '@/components/FieldModal';
import { iconRegistry } from '@/components/Icon';
import { Text, TextProps } from '@/components/Text';
import { TxKeyPath } from '@/i18n';
import { translate } from '@/i18n/translate';
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
    const valueInWork = iconRegistry[value as unknown as CategoryIconType] ? (value as CategoryIconType) : AccountIcon.Cash;
    const { themed, theme } = useAppTheme();

    return (
        <FieldModal
            labelTx={labelTx}
            label={label}
            style={[themed($containerOverride), style]}
            disabled={disabled}
            status={status}
            helper={helper}
            helperTx={helperTx}
            helperTxOptions={helperTxOptions}
            HelperTextProps={HelperTextProps}
            triggerStyle={themed($triggerOverride)}
            renderTrigger={() =>
                valueInWork ? (
                    <View style={themed($selectedIconWrapper)}>
                        <CategoryIcon name={valueInWork} size={28} color={theme.colors.text} />
                    </View>
                ) : (
                    <Text style={themed($placeholderText)}>{translate('common:icon')}</Text>
                )
            }
            renderContent={(close) => (
                <ScrollView showsVerticalScrollIndicator={false} style={{ gap: spacing.md, marginTop: spacing.lg }}>
                    {iconCategories.map((category) => (
                        <View key={category.name} style={themed($categorySection)}>
                            <Text style={themed($categoryTitle)}>{category.name}</Text>
                            <View style={themed($iconGrid)}>
                                {category.icons.map((icon) => (
                                    <Pressable
                                        key={icon}
                                        style={[themed($iconItem), value === icon && themed($iconItemSelected)]}
                                        onPress={() => {
                                            close();
                                            onChange?.(icon);
                                        }}
                                    >
                                        <CategoryIcon
                                            name={icon}
                                            size={28}
                                            color={value === icon ? theme.colors.palette.primary500 : theme.colors.text}
                                        />
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}
        />
    );
}

/* ── IconField-specific style overrides ── */

const $containerOverride: ThemedStyle<ViewStyle> = () => ({
    height: 80,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
});

const $triggerOverride: ThemedStyle<ViewStyle> = () => ({
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    width: 54,
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
