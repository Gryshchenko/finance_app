import { View, ViewStyle } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface EditButtonsProps {
    isView: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    onCancel?: () => void;
    onSave?: () => void;
}

export const EditButtons: React.FC<EditButtonsProps> = ({ isView, onEdit, onDelete, onCancel, onSave }) => {
    return isView ? (
        <View style={$buttons}>
            {onEdit && <Button text="Edit" onPress={onEdit} />}
            {onDelete && <Button style={$deleteButton} text="Delete" onPress={onDelete} />}
        </View>
    ) : (
        <View style={$buttons}>
            {onCancel && <Button text="Cancel" onPress={onCancel} />}
            {onSave && <Button text="Save" onPress={onSave} />}
        </View>
    );
};

const $buttons: ViewStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    justifyContent: 'center',
};

const $deleteButton: ViewStyle = {
    backgroundColor: colors.error,
};
