import { View } from 'react-native';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { spacing } from '@/theme/spacing';
export const Field = ({ label, style, Component = TextField, componentProps }) => {
    return (
        <View style={[$wrapper, style]}>
            <Text text={label} preset="subheading" size={'xs'} />
            <Component {...componentProps} />
        </View>
    );
};
const $wrapper = {
    marginBottom: spacing.md,
};
