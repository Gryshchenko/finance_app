import { FC } from 'react';
import { ScrollView, TextStyle, View, ViewStyle } from 'react-native';
import { IPendingConnectionRequest } from '@tenpercent/shared';

import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { PressableIcon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import { spacing } from '@/theme/spacing';
import { $styles } from '@/theme/styles';
import { ThemedStyle } from '@/theme/types';

interface IProps {
    data: IPendingConnectionRequest[] | undefined;
    onAccept?: (connectionId: number) => void;
    onDecline?: (connectionId: number) => void;
    isProcessing?: boolean;
}

const formatRequestedAt = (createdAt: string): string => {
    const date = new Date(createdAt);
    return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
};

export const PendingRequestsList: FC<IProps> = function PendingRequestsList({ data, onAccept, onDecline, isProcessing }) {
    const { themed } = useAppTheme();

    if (!data?.length) {
        return <EmptyState headingTx={'sharing:pendingTitle'} contentTx={'sharing:pendingEmpty'} />;
    }

    return (
        <ScrollView style={$styles.flex1} contentContainerStyle={$content}>
            <Text tx={'sharing:pendingCaption'} style={themed($caption)} />
            <View style={themed($card)}>
                {data.map((request, index) => (
                    <RequestRow
                        key={request.connectionId}
                        request={request}
                        isLast={index === data.length - 1}
                        disabled={isProcessing}
                        onAccept={() => onAccept?.(request.connectionId)}
                        onDecline={() => onDecline?.(request.connectionId)}
                    />
                ))}
            </View>
        </ScrollView>
    );
};

const RequestRow: FC<{
    request: IPendingConnectionRequest;
    isLast: boolean;
    disabled?: boolean;
    onAccept: () => void;
    onDecline: () => void;
}> = ({ request, isLast, disabled, onAccept, onDecline }) => {
    const {
        themed,
        theme: { colors },
    } = useAppTheme();
    const requestedAt = formatRequestedAt(request.createdAt);
    return (
        <View style={[themed($row), !isLast && themed($rowBorder)]}>
            <Avatar name={request.publicName || request.email} size={44} />
            <View style={$rowText}>
                <Text text={request.publicName || request.email} style={themed($name)} numberOfLines={1} />
                <Text text={request.email} style={themed($email)} numberOfLines={1} />
                {!!requestedAt && <Text text={requestedAt} style={themed($requestedAt)} />}
            </View>
            <View style={$actions}>
                <PressableIcon
                    size={20}
                    icon="check"
                    color={colors.text}
                    disabled={disabled}
                    onPress={onAccept}
                    containerStyle={$actionButton}
                />
                <PressableIcon
                    size={20}
                    icon="x"
                    color={colors.error}
                    disabled={disabled}
                    onPress={onDecline}
                    containerStyle={$actionButton}
                />
            </View>
        </View>
    );
};

const $content: ViewStyle = {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
};

const $caption: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 14,
    color: colors.textDim,
    fontFamily: typography.primary.normal,
    marginBottom: spacing.md,
});

const $card: ThemedStyle<ViewStyle> = ({ colors }) => ({
    backgroundColor: colors.palette.neutral100,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
});

const $row: ThemedStyle<ViewStyle> = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
});

const $rowBorder: ThemedStyle<ViewStyle> = ({ colors }) => ({
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
});

const $rowText: ViewStyle = {
    flex: 1,
};

const $name: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 16,
    color: colors.text,
    fontFamily: typography.primary.semiBold,
    flexShrink: 1,
});

const $email: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 13,
    color: colors.textDim,
    fontFamily: typography.primary.normal,
    marginTop: 2,
});

const $requestedAt: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 11,
    color: colors.textDim,
    fontFamily: typography.primary.normal,
    marginTop: 2,
});

const $actions: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
};

const $actionButton: ViewStyle = {
    padding: spacing.xs,
};
