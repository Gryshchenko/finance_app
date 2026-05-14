import { View, Pressable, ViewStyle, TextStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { Text } from '@/components/Text';
import { TxKeyPath } from '@/i18n/index';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';
import { OverviewPath } from '@/types/OverviewPath';

interface Props {
    tx: TxKeyPath;
}

export const HeaderV2: React.FC<Props> = ({ tx }) => {
    const { themed, theme } = useAppTheme();
    const { colors } = theme;
    const navigation = useNavigation();
    return (
        <View style={themed($container)}>
            <View style={themed($left)}>
                {/*<View style={themed($avatarWrapper)}>*/}
                {/*    <Image*/}
                {/*        source={{*/}
                {/*            uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRWsgBQT9hcumH74QYBR2_LOyyBUhJCP7hRFwrzIyUv3lUdWJOzEbAN053eruqn_QiwllZervUVP0R4HyXaD0-Xw0hS8eU535L1TZ0N4dQwR_QBTsNMfzw9vNiF3QJicnSYADmPL-gsOdrsksJmOWwaH6K3rZ4EufkI0CPzhZ2PUdlJzH0rbLaucSzsMsvyb4SU-Flz76Qw6EwxlCPR56w9vmy8B5Lz1FABf0RG-2zB8dNgYkDJ4Ahr-YC6n0W7ZGQNmLPdlYCyUs',*/}
                {/*        }}*/}
                {/*        style={themed($avatar)}*/}
                {/*    />*/}
                {/*    <View style={themed($onlineDot)} />*/}
                {/*</View>*/}

                <View>
                    <Text tx={tx} style={themed($subtitle)}></Text>
                </View>
            </View>

            <Pressable
                onPress={() => navigation.getParent()?.navigate(OverviewPath.Settings)}
                style={themed($notificationButton)}
            >
                <MaterialIcons name="menu" size={20} color={colors.text} />
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

export const $subtitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.textDim,
    fontWeight: '500',
    fontFamily: typography.fonts.funnelSans.medium,
});

export const $notificationButton: ThemedStyle<ViewStyle> = () => ({
    width: 40,
    height: 40,

    alignItems: 'center',
    justifyContent: 'center',
});
