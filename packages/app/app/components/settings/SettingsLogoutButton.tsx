import { Pressable, TextStyle, ViewStyle } from 'react-native';

import { Text } from '@/components/Text';
import { useAuth } from '@/context/AuthContext';
import { translate } from '@/i18n/translate';
import AlertService from '@/services/AlertService';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';

export function SettingsLogoutButton() {
    const { themed } = useAppTheme();
    const { doLogout } = useAuth();

    function handlePress() {
        AlertService.confirm(
            translate('settingsScreen:logoutConfirmTitle'),
            translate('settingsScreen:logoutConfirmMessage'),
            () => doLogout(),
        );
    }

    return (
        <Pressable style={themed($button)} onPress={handlePress}>
            <Text tx="common:logOut" style={themed($text)} />
        </Pressable>
    );
}

const $button: ThemedStyle<ViewStyle> = ({ colors }) => ({
    width: '100%',
    backgroundColor: colors.palette.neutral100,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
});

const $text: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 14,
    fontWeight: '500',
    color: colors.error,
    fontFamily: typography.primary.medium,
});
