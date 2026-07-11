import { Alert } from 'react-native';

import { translate } from '@/i18n/translate';

class AlertService {
    static info(title: string, message: string) {
        Alert.alert(title, message, [{ text: 'OK' }]);
    }

    static error(message: string, title: string = 'Error') {
        Alert.alert(title, message, [{ text: translate('common:ok'), style: 'destructive' }]);
    }

    static confirm(title: string, message: string, onConfirm: () => void, onCancel?: () => void) {
        Alert.alert(title, message, [
            { text: translate('common:cancel'), onPress: onCancel, style: 'cancel' },
            { text: translate('common:ok'), onPress: onConfirm },
        ]);
    }

    static prompt(
        title: string,
        message: string,
        actions: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' | undefined }>,
    ) {
        Alert.alert(title, message, actions);
    }
}

export default AlertService;
