import { TextStyle, View, ViewStyle } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { TextButton } from '@/components/buttons/TextButton';
import { useAppTheme } from '@/theme/context';
import { spacing } from '@/theme/spacing';
import { ThemedStyle } from '@/theme/types';

interface EditButtonsProps {
    isView: boolean;
    isCreate: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    onCancel?: () => void;
    onSave?: () => void;
}

export const EditButtons: React.FC<EditButtonsProps> = ({ isView, onEdit, onDelete, onCancel, onSave, isCreate }) => {
    const { themed } = useAppTheme();
    if (isCreate) {
        return (
            <View style={$buttons}>
                {onSave && <Button preset={'reversed'} tx={'common:create'} onPress={onSave} />}
                {onCancel && <TextButton preset={'reversed'} tx={'common:cancel'} onPress={onCancel} />}
            </View>
        );
    }
    return isView ? (
        <View style={$buttons}>
            {onEdit && <Button preset={'reversed'} tx={'common:edit'} onPress={onEdit} />}
            {onDelete && (
                <TextButton textStyle={themed($deleteText)} preset={'reversed'} tx={'common:delete'} onPress={onDelete} />
            )}
        </View>
    ) : (
        <View style={$buttons}>
            {onSave && <Button preset={'reversed'} tx="common:saveChanges" onPress={onSave} />}
            {onCancel && <TextButton preset={'reversed'} tx="common:cancel" onPress={onCancel} />}
        </View>
    );
};

const $buttons: ViewStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    justifyContent: 'center',
};

const $deleteText: ThemedStyle<TextStyle> = ({ colors }) => ({
    color: colors.error,
});
