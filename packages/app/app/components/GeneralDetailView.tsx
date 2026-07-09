import { ReactNode, FC } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from 'react-native';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';

import { EditButtons } from '@/components/buttons/EditButtons';
import { ScrollEdgeBlur } from '@/components/ScrollEdgeBlur';
import { spacing } from '@/theme/spacing';
import { $styles } from '@/theme/styles';

// Scroll distance over which each edge blur fades in / out.
const EDGE_FADE = 24;

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
    // Track the scroll metrics so the edges only frost while there is content to reveal:
    // the top edge fades in once scrolled down, the bottom edge fades out at the very end.
    const scrollY = useSharedValue(0);
    const layoutHeight = useSharedValue(0);
    const contentHeight = useSharedValue(0);

    const topProgress = useDerivedValue(() => Math.min(Math.max(scrollY.value / EDGE_FADE, 0), 1));
    const bottomProgress = useDerivedValue(() => {
        const distanceFromBottom = contentHeight.value - layoutHeight.value - scrollY.value;
        return Math.min(Math.max(distanceFromBottom / EDGE_FADE, 0), 1);
    });

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        scrollY.value = contentOffset.y;
        layoutHeight.value = layoutMeasurement.height;
        contentHeight.value = contentSize.height;
    };

    return (
        <>
            <View style={$styles.flex1}>
                <ScrollView
                    style={$styles.flex1}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ gap: spacing.md, marginTop: spacing.lg }}
                >
                    {children}
                </ScrollView>
                <ScrollEdgeBlur edge="top" progress={topProgress} />
                <ScrollEdgeBlur edge="bottom" progress={bottomProgress} />
            </View>
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
