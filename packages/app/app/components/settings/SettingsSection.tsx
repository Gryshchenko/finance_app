import { View, ViewStyle, TextStyle } from 'react-native';

import { Text } from '@/components/Text';
import { TxKeyPath } from '@/i18n/index';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';

interface Props {
    titleTx: TxKeyPath;
    children: React.ReactNode;
}

export function SettingsSection({ titleTx, children }: Props) {
    const { themed } = useAppTheme();
    return (
        <View style={$wrapper}>
            <Text tx={titleTx} style={themed($title)} />
            <View style={themed($card)}>{children}</View>
        </View>
    );
}

const $wrapper: ViewStyle = {
    marginBottom: 32,
};

const $title: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '500',
    color: colors.textDim,
    fontFamily: typography.primary.medium,
    marginBottom: 8,
    paddingLeft: 4,
});

const $card: ThemedStyle<ViewStyle> = ({ colors }) => ({
    backgroundColor: colors.palette.neutral100,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
});
