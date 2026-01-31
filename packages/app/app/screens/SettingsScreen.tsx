import { FC } from 'react';
import { TextStyle } from 'react-native';

import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { MainTabScreenProps } from '@/navigators/OverviewNavigator';
import { useAppTheme } from '@/theme/context';
import { $styles } from '@/theme/styles';
import type { ThemedStyle } from '@/theme/types';

export const SettingsScreen: FC<MainTabScreenProps<'settings'>> = function SettingsScreen(_props) {
    const { themed } = useAppTheme();
    return (
        <Screen preset="scroll" contentContainerStyle={$styles.container} safeAreaEdges={['top']}>
            <Text preset="heading" tx="demoCommunityScreen:title" style={themed($title)} />
        </Screen>
    );
};

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
    marginBottom: spacing.sm,
});
