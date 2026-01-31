import { FC } from 'react';
import { View, StyleSheet } from 'react-native';

import PendingDots from '@/components/PendingDots';
import { useAppTheme } from '@/theme/context';

interface IProps {}
export const PendingState: FC<IProps> = () => {
    const { theme } = useAppTheme();
    return (
        <View style={styles.container}>
            <PendingDots size={10} color={theme.colors.text} dotScale={1.4} speed={350} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
});
