import { View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { useAppTheme } from '@/theme/context';
import { $styles } from '@/theme/styles';

export const ErrorState = ({
    headingTx = 'common:error',
    contentTx = 'errorScreen:title',
    buttonTx = 'common:returnBack',
    buttonOnPress,
}) => {
    const { themed } = useAppTheme();
    return (
        <View style={themed([$styles.row, $centerAlignTitle])}>
            <EmptyState
                button={undefined}
                headingTx={headingTx}
                contentTx={contentTx}
                buttonTx={buttonTx}
                buttonOnPress={buttonOnPress}
            />
        </View>
    );
};
const $centerAlignTitle = {
    textAlign: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 'auto',
};
