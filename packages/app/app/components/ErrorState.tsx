import { FC } from 'react';
import { TextStyle, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { TextProps } from '@/components/Text';
import { TxKeyPath } from '@/i18n';
import { useAppTheme } from '@/theme/context';
import { $styles } from '@/theme/styles';

interface IProps {
    headingTx?: TextProps['tx'];
    contentTx?: TextProps['tx'];
    buttonTx?: TextProps['tx'];
    buttonOnPress?: () => void;
}

export const ErrorState: FC<IProps> = ({
    headingTx = 'common:error' as TxKeyPath,
    contentTx = 'errorScreen:title' as TxKeyPath,
    buttonTx = 'common:returnBack' as TxKeyPath,
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
const $centerAlignTitle: TextStyle = {
    textAlign: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 'auto',
};
