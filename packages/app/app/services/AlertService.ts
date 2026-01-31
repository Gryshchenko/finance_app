import { Alert, Platform } from 'react-native';

import { translate } from '@/i18n/translate';

class AlertService {
    static info(title: string, message: string) {
        if (Platform.OS === 'web') {
            window.alert(`${title}\n\n${message}`);
        } else {
            Alert.alert(title, message, [{ text: 'OK' }]);
        }
    }

    static error(message: string, title: string = 'Error') {
        if (Platform.OS === 'web') {
            window.alert(`${title}\n\n${message}`);
        } else {
            Alert.alert(title, message, [{ text: translate('common:ok'), style: 'destructive' }]);
        }
    }

    static confirm(title: string, message: string, onConfirm: () => void, onCancel?: () => void) {
        if (Platform.OS === 'web') {
            const result = window.confirm(`${title}\n\n${message}`);
            if (result) {
                onConfirm?.();
            } else {
                onCancel?.();
            }
        } else {
            Alert.alert(title, message, [
                { text: translate('common:cancel'), onPress: onCancel, style: 'cancel' },
                { text: translate('common:ok'), onPress: onConfirm },
            ]);
        }
    }

    static prompt(title: string, message: string, options: { onConfirm: (value?: string) => void; onCancel?: () => void }) {
        if (Platform.OS === 'web') {
            const value = window.prompt(`${title}\n\n${message}`);
            if (value !== null) {
                options.onConfirm(value);
            } else {
                options.onCancel?.();
            }
        } else {
            Alert.alert(title, message, [
                { text: translate('common:cancel'), onPress: options.onCancel, style: 'cancel' },
                { text: translate('common:ok'), onPress: () => options.onConfirm() },
            ]);
        }
    }
}

export default AlertService;
