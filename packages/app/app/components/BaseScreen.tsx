import { FC } from 'react';
import { TextStyle, View } from 'react-native';

import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { TxKeyPath } from '@/i18n';
import { useAppTheme } from '@/theme/context';
import { $styles, headerIconSize } from '@/theme/styles';

interface BaseScreenProps {
    titleTx?: TxKeyPath | undefined;
    children: React.ReactNode;
}

export const BaseScreen: FC<BaseScreenProps> = ({ titleTx, children }) => {
    const { theme } = useAppTheme();
    return (
        <View>
            <Header
                titleTx={titleTx}
                titleMode="flex"
                titleStyle={$rightAlignTitle}
                RightActionComponent={
                    <View style={$styles.headerAction}>
                        <Icon icon="more" color={theme.colors.text} size={headerIconSize} />
                    </View>
                }
            />
            <View>{children}</View>
        </View>
    );
};
const $rightAlignTitle: TextStyle = {
    textAlign: 'center',
};
