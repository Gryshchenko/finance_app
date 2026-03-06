import { StyleProp, TextStyle, View } from 'react-native';

import { TextField } from '@/components/TextField';
import { TxKeyPath } from '@/i18n';

interface FieldProps<T> {
    style?: StyleProp<TextStyle>;
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

export const Field: React.FC<FieldProps<unknown>> = ({ style, Component = TextField, componentProps }) => {
    return (
        <View style={[$wrapper, style]}>
            <Component {...componentProps} />
        </View>
    );
};

const $wrapper: StyleProp<TextStyle> = {
    marginBottom: 0,
};
