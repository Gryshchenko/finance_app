import { View, Pressable, ViewStyle, TextStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { IProfileClient } from 'tenpercent/shared';

import { ProfileAvatar } from '@/components/Avatar';
import { Text } from '@/components/Text';
import { useAppQuery } from '@/hooks/useAppQuery';
import { fetchProfile } from '@/hooks/useSettingsProfile';
import { TxKeyPath } from '@/i18n/index';
import { QueryKeys, QueryStaleTimes } from '@/services/QueryCacheService';
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

    const { data: profile } = useAppQuery<IProfileClient | undefined>(QueryKeys.profile(), fetchProfile, {
        staleTime: QueryStaleTimes.detail,
    });

    const avatarSeed = profile?.publicName || profile?.email || 'Clara Barton';

    return (
        <View style={themed($container)}>
            <View style={themed($left)}>
                <View style={themed($avatarWrapper)}>
                    <ProfileAvatar avatar={profile?.avatar} name={avatarSeed} size={40} />
                    <View style={themed($onlineDot)} />
                </View>

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

export const $avatarWrapper: ThemedStyle<ViewStyle> = () => ({
    position: 'relative',
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
