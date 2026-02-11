import { View, Image, Pressable } from 'react-native';
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Text } from '@/components/Text';
import { TxKeyPath } from '@/i18n/index';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

interface Props {
    tx: TxKeyPath;
}

export const HeaderV2: React.FC<Props> = ({ tx }) => {
    const { themed } = useAppTheme();
    return (
        <View style={themed($container)}>
            <View style={themed($left)}>
                <View style={themed($avatarWrapper)}>
                    <Image
                        source={{
                            uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRWsgBQT9hcumH74QYBR2_LOyyBUhJCP7hRFwrzIyUv3lUdWJOzEbAN053eruqn_QiwllZervUVP0R4HyXaD0-Xw0hS8eU535L1TZ0N4dQwR_QBTsNMfzw9vNiF3QJicnSYADmPL-gsOdrsksJmOWwaH6K3rZ4EufkI0CPzhZ2PUdlJzH0rbLaucSzsMsvyb4SU-Flz76Qw6EwxlCPR56w9vmy8B5Lz1FABf0RG-2zB8dNgYkDJ4Ahr-YC6n0W7ZGQNmLPdlYCyUs',
                        }}
                        style={themed($avatar)}
                    />
                    <View style={themed($onlineDot)} />
                </View>

                <View>
                    <Text tx={tx} style={themed($subtitle)}></Text>
                </View>
            </View>

            <Pressable style={themed($notificationButton)}>
                <MaterialIcons name="notifications" size={20} />
            </Pressable>
        </View>
    );
};
export const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: 0,
    paddingTop: 10,
    paddingBottom: 10,

    backgroundColor: colors.background,
});

export const $left: ThemedStyle<ViewStyle> = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
});

export const $avatarWrapper: ThemedStyle<ViewStyle> = () => ({
    position: 'relative',
});

export const $avatar: ThemedStyle<ImageStyle> = () => ({
    width: 40,
    height: 40,
    borderRadius: 20,
});

export const $onlineDot: ThemedStyle<ViewStyle> = ({ colors }) => ({
    position: 'absolute',
    right: -2,
    bottom: -2,

    width: 10,
    height: 10,
    borderRadius: 5,

    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
});

export const $subtitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.textDim,
    fontWeight: '500',
    fontFamily: typography.fonts.funnelSans.medium,
});

export const $notificationButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
    width: 40,
    height: 40,
    borderRadius: 20,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.palette.neutral100,
});
