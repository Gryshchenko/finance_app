import { View } from 'react-native';

import { TxKeyPath } from '@/i18n/index';
import { InfoToast } from '@/screens/Toaster/InfoToast';
import { ToastType } from '@/services/ToastService';
import { useSafeAreaInsetsStyle } from '@/utils/useSafeAreaInsetsStyle';

export const DefaultToast: React.FC<{
    title: TxKeyPath;
    message: TxKeyPath;
    onClose: () => void;
    type: ToastType;
}> = ({ title, message, type, onClose }) => {
    const $containerInsets = useSafeAreaInsetsStyle(['top', 'bottom']);
    return (
        <View style={$containerInsets}>
            <InfoToast title={title} message={message} type={type} onClose={onClose} />
        </View>
    );
};
