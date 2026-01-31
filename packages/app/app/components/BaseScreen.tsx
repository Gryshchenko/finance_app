import { FC } from 'react';
import { TextStyle, View, ViewStyle } from 'react-native';

import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { TxKeyPath } from '@/i18n';
import { useAppTheme } from '@/theme/context';
import { $styles } from '@/theme/styles';
import type { ThemedStyle } from '@/theme/types';

interface BaseScreenProps {
    titleTx?: TxKeyPath | undefined;
    children: React.ReactNode;
}

export const BaseScreen: FC<BaseScreenProps> = ({ titleTx, children }) => {
    const { themed, theme } = useAppTheme();
    return (
        <View>
            <Header
                titleTx={titleTx}
                titleMode="flex"
                titleStyle={$rightAlignTitle}
                RightActionComponent={
                    <View style={themed([$styles.row, $customLeftAction])}>
                        <Icon icon="more" color={theme.colors.text} size={20} />
                    </View>
                }
                safeAreaEdges={[]}
            />
            <View>{children}</View>
        </View>
    );
};
const $rightAlignTitle: TextStyle = {
    textAlign: 'center',
};
const $customLeftAction: ThemedStyle<ViewStyle> = () => ({
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
});
