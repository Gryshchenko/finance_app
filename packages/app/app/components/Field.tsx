import { StyleProp, TextStyle, View } from 'react-native';

import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { TxKeyPath } from '@/i18n';
import { spacing } from '@/theme/spacing';

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

export const Field: React.FC<FieldProps<unknown>> = ({ label, style, Component = TextField, componentProps }) => {
    return (
        <View style={[$wrapper, style]}>
            <Text text={label} preset="subheading" size={'xs'} />
            <Component {...componentProps} />
        </View>
    );
};

const $wrapper: StyleProp<TextStyle> = {
    marginBottom: spacing.md,
};
