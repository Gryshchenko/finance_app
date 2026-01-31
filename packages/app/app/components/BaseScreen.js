import { View } from 'react-native';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { useAppTheme } from '@/theme/context';
import { $styles } from '@/theme/styles';
export const BaseScreen = ({ titleTx, children }) => {
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
const $rightAlignTitle = {
    textAlign: 'center',
};
const $customLeftAction = () => ({
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
});
