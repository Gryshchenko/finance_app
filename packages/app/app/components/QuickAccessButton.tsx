import { useEffect, useState } from 'react';
import { Pressable, TextStyle, View, ViewStyle } from 'react-native';
import { AuthenticationType } from 'expo-local-authentication';
import { MaterialIcons } from '@expo/vector-icons';

import { Text } from '@/components/Text';
import { AuthService } from '@/services/AuthService';
import { SecureBiometricStorage } from '@/services/SecureBiometricStorage';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';
import { Logger } from '@/utils/logger/Logger';

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
                const isCredentialStored = await AuthService.instance().isCredentialStored();
                if (isBiometricAvailable && isCredentialStored) {
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
                <View style={themed($container)}>
                    <MaterialIcons name={iconName} size={40} color={pressed ? colors.text : colors.textDim} />
                    <Text tx={'loginScreen:quickAccess'} style={themed($quickAccessLabel)} />
                </View>
            )}
        </Pressable>
    );
};

const $container: ThemedStyle<ViewStyle> = () => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
});
const $quickAccessLabel: ThemedStyle<TextStyle> = ({ typography, colors }) => ({
    marginTop: 5,
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
