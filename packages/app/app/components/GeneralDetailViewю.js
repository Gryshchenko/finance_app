import { ScrollView, View } from 'react-native';
import { EditButtons } from '@/components/buttons/EditButtons';
import { spacing } from '@/theme/spacing';
export const GeneralDetailView = ({ children, isView, onEdit, onCancel, onSave, onDelete }) => {
    return (
        <>
            <ScrollView contentContainerStyle={{ gap: spacing.md, marginTop: spacing.lg }}>{children}</ScrollView>

            <View style={{ marginTop: spacing.xl }}>
                <EditButtons isView={isView} onEdit={onEdit} onCancel={onCancel} onSave={onSave} onDelete={onDelete} />
            </View>
        </>
    );
};
