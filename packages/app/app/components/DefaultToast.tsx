import { View } from 'react-native';

import { InfoToast } from '@/screens/Toaster/InfoToast';
import { ToastType } from '@/services/ToastService';
import { useSafeAreaInsetsStyle } from '@/utils/useSafeAreaInsetsStyle';

export const DefaultToast: React.FC<{
    title: string;
    message: string;
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
