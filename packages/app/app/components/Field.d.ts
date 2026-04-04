import { StyleProp, TextStyle } from 'react-native';

import { TxKeyPath } from '@/i18n';

interface FieldProps<T> {
    style?: StyleProp<TextStyle>;
    label: string;
    Component?: React.FC<T>;
    componentProps?: {
        value: string | undefined;
        editable?: boolean;
        onChangeText?: (text: string) => void;
        style?: StyleProp<TextStyle>;
        helperTx?: TxKeyPath;
        status?: 'error' | 'disabled';
        [key: string]: unknown;
    };
}
export declare const Field: React.FC<FieldProps<unknown>>;
export {};
