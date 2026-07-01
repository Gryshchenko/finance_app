import { ReactNode, FC } from 'react';
import { ScrollView, View } from 'react-native';

import { EditButtons } from '@/components/buttons/EditButtons';
import { spacing } from '@/theme/spacing';

interface GeneralDetailViewProps {
    children: ReactNode;
    isView: boolean;
    isCreate: boolean;
    isEdit: boolean;
    onEdit?: () => void;
    onCancel?: () => void;
    onSave?: () => void;
    onDelete?: () => void;
    isSaveDisabled?: boolean;
    isDeleteDisabled?: boolean;
}

export const GeneralDetailView: FC<GeneralDetailViewProps> = ({
    children,
    isView,
    onEdit,
    onCancel,
    onSave,
    onDelete,
    isCreate,
    isSaveDisabled,
    isDeleteDisabled,
}) => {
    return (
        <>
            <ScrollView contentContainerStyle={{ gap: spacing.md, marginTop: spacing.lg }}>{children}</ScrollView>
            <View style={{ marginTop: spacing.xl }}>
                <EditButtons
                    isSaveDisabled={isSaveDisabled}
                    isDeleteDisabled={isDeleteDisabled}
                    isView={isView}
                    onEdit={onEdit}
                    onCancel={onCancel}
                    onSave={onSave}
                    onDelete={onDelete}
                    isCreate={isCreate}
                />
            </View>
        </>
    );
};
