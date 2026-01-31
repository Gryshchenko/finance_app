import { useEffect, useState } from 'react';
import { Pressable, TextStyle, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';
import { Logger } from '@/utils/logger/Logger';
import { SecureBiometricStorage } from '@/services/SecureBiometricStorage';
import { AuthenticationType } from 'expo-local-authentication';

type QuickAccessType = 'fingerprint' | 'face' | null;

type Props = {
    onPress?: (type: QuickAccessType) => void;
};

export const QuickAccessButton = ({}: Props) => {
    const {
        themed,
        theme: { colors },
    } = useAppTheme();
    const [type, setType] = useState<QuickAccessType>(null);

    useEffect(() => {
        const handler = async () => {
            try {
                const storage = new SecureBiometricStorage();
                const isBiometricAvailable = await storage.isBiometricAvailable();
                if (isBiometricAvailable) {
                    const support = await storage.supportedAuthenticationTypes();
                    if (support.includes(AuthenticationType.FACIAL_RECOGNITION)) {
                        setType('face');
                    }
                    if (support.includes(AuthenticationType.FINGERPRINT)) {
                        setType('fingerprint');
                    }
                }
            } catch (e: unknown) {
                Logger.Of('QuickAccessButton').error(JSON.stringify(e));
            }
        };
        void handler();
    }, []);

    if (!type) return null;

    const iconName = type === 'face' ? 'photo-camera-front' : 'fingerprint';

    return (
        <Pressable style={themed($quickAccessContainer)} onPress={() => {}}>
            {({ pressed }) => (
                <>
                    <MaterialIcons name={iconName} size={40} color={pressed ? colors.text : colors.textDim} />
                    <Text tx={'loginScreen:quickAccess'} style={themed($quickAccessLabel)} />{' '}
                </>
            )}
        </Pressable>
    );
};

const $quickAccessLabel: ThemedStyle<TextStyle> = ({ typography, colors }) => ({
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 2,
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
    color: colors.textDim,
    fontFamily: typography.fonts.funnelSans.semiBold,
});

const $quickAccessContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: spacing.xxl,
});
