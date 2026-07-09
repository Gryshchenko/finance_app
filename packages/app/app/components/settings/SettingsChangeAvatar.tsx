import { FC, useState } from 'react';
import { Pressable, View, ViewStyle, TextStyle } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import {
    AVATAR_PALETTES,
    AVATAR_VARIANTS,
    AvatarVariant,
    DEFAULT_AVATAR_COLORS,
    DEFAULT_AVATAR_VARIANT,
    IAvatarConfig,
} from 'tenpercent/shared';

import { Avatar } from '@/components/Avatar';
import { EditButtons } from '@/components/buttons/EditButtons';
import { Text } from '@/components/Text';
import { useInvalidateQuery } from '@/hooks/useAppQuery';
import { useEditView } from '@/hooks/useEditView';
import { OverviewTabParamList } from '@/navigators/OverviewNavigator';
import { SettingsPath } from '@/navigators/SettingsStackNavigator';
import { buildGeneralApiBaseHandler, GeneralApiProblemKind } from '@/services/api/apiProblem';
import { ProfileService } from '@/services/ProfileService';
import { InvalidationGroups } from '@/services/QueryCacheService';
import ToastService from '@/services/ToastService';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { OverviewPath } from '@/types/OverviewPath';

interface Props {
    avatar: IAvatarConfig | undefined;
    seed: string;
}

const palettesEqual = (a: string[], b: string[]) => a.length === b.length && a.every((c, i) => c === b[i]);

export const SettingsChangeAvatar: FC<Props> = function SettingsChangeAvatar({ avatar, seed }) {
    const { themed } = useAppTheme();
    const navigation = useNavigation<NavigationProp<OverviewTabParamList>>();
    const invalidateQuery = useInvalidateQuery();
    const { withFetching, isFetching } = useEditView<Record<string, never>>({});

    const [variant, setVariant] = useState<AvatarVariant>(avatar?.variant ?? DEFAULT_AVATAR_VARIANT);
    const [colors, setColors] = useState<string[]>(avatar?.colors ?? DEFAULT_AVATAR_COLORS);

    const handleSave = async () => {
        await withFetching(async () => {
            const response = await ProfileService.instance().doPatchProfile({ avatar: { variant, colors } });
            if (response.kind === GeneralApiProblemKind.Ok) {
                ToastService.info({ title: 'common:info', message: 'settingsChangeAvatarScreen:updateSuccess' });
                await invalidateQuery(InvalidationGroups.profile());
                navigation.goBack();
            } else {
                buildGeneralApiBaseHandler(response);
            }
        });
    };

    return (
        <View style={$container}>
            <Text tx="settingsChangeAvatarScreen:description" style={themed($description)} />

            <View style={$preview}>
                <Avatar name={seed} variant={variant} colors={colors} size={112} />
            </View>

            <Text tx="settingsChangeAvatarScreen:style" style={themed($sectionLabel)} />
            <View style={$grid}>
                {AVATAR_VARIANTS.map((v) => {
                    const isSelected = v === variant;
                    return (
                        <Pressable
                            key={v}
                            onPress={() => setVariant(v)}
                            style={[themed($tile), isSelected && themed($tileSelected)]}
                        >
                            <Avatar name={seed} variant={v} colors={colors} size={52} />
                        </Pressable>
                    );
                })}
            </View>

            <Text tx="settingsChangeAvatarScreen:palette" style={themed($sectionLabel)} />
            <View style={$grid}>
                {AVATAR_PALETTES.map((palette, idx) => {
                    const isSelected = palettesEqual(palette, colors);
                    return (
                        <Pressable
                            key={idx}
                            onPress={() => setColors(palette)}
                            style={[themed($paletteTile), isSelected && themed($tileSelected)]}
                        >
                            {palette.map((c, i) => (
                                <View key={i} style={[$swatch, { backgroundColor: c }]} />
                            ))}
                        </Pressable>
                    );
                })}
            </View>

            <View style={$spacer} />
            <EditButtons
                isCreate={false}
                isView={false}
                isSaveDisabled={isFetching}
                onSave={handleSave}
                onCancel={() => {
                    navigation.navigate(OverviewPath.Settings, { screen: SettingsPath.Settings });
                }}
            />
        </View>
    );
};

const $container: ViewStyle = {
    flex: 1,
};

const $preview: ViewStyle = {
    alignItems: 'center',
    marginBottom: 24,
};

const $grid: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
};

const $spacer: ViewStyle = {
    flex: 1,
};

const $swatch: ViewStyle = {
    flex: 1,
    height: '100%',
};

const $description: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
    fontSize: 14,
    fontFamily: typography.primary.medium,
    color: colors.textDim,
    lineHeight: 20,
    marginBottom: spacing.lg,
});

const $sectionLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '500',
    color: colors.textDim,
    fontFamily: typography.primary.medium,
    marginBottom: 12,
    paddingLeft: 4,
});

const $tile: ThemedStyle<ViewStyle> = ({ colors }) => ({
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.palette.neutral100,
    borderWidth: 1,
    borderColor: colors.border,
});

const $tileSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderColor: colors.tint,
    borderWidth: 2,
});

const $paletteTile: ThemedStyle<ViewStyle> = ({ colors }) => ({
    width: 72,
    height: 40,
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
});
