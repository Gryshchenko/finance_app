import { FC } from 'react';
import { ScrollView, TextStyle, ViewStyle } from 'react-native';
import { IConnectedMember } from '@tenpercent/shared';

import { EmptyState } from '@/components/EmptyState';
import { MembersCard } from '@/components/sharing/MembersCard';
import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import { spacing } from '@/theme/spacing';
import { $styles } from '@/theme/styles';
import { ThemedStyle } from '@/theme/types';

interface IProps {
    data: IConnectedMember[] | undefined;
    onPressUser?: (connectionId: number) => void;
}

export const ConnectedUsersList: FC<IProps> = function ConnectedUsersList({ data, onPressUser }) {
    const { themed } = useAppTheme();

    if (!data?.length) {
        return <EmptyState headingTx={'sharing:connectedUsersTitle'} contentTx={'sharing:connectedUsersEmpty'} />;
    }

    return (
        <ScrollView style={$styles.flex1} contentContainerStyle={$content}>
            <Text tx={'sharing:connectedUsersCaption'} style={themed($caption)} />
            <MembersCard data={data} onPressMember={onPressUser} />
        </ScrollView>
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
