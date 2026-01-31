import { View, TextStyle } from 'react-native';

import { TextButton } from '@/components/buttons/TextButton';
import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

export const SignUpPrompt = ({ onSignUp }: { onSignUp?: () => void }) => {
    const { themed } = useAppTheme();
    return (
        <View style={themed($container)}>
            <Text tx={'loginScreen:dontHaveAccount'} style={themed($dontHaveAccount)}></Text>
            <TextButton tx={'loginScreen:signup'} onPress={onSignUp} />
        </View>
    );
};

const $container: ThemedStyle<TextStyle> = ({ spacing }) => ({
    textAlign: 'center',
    marginTop: spacing.xxl,
});

const $dontHaveAccount: ThemedStyle<TextStyle> = ({ typography, colors }) => ({
    fontSize: 12,
    lineHeight: 16,
    color: colors.textDim,
    textAlign: 'center',
    fontFamily: typography.fonts.funnelSans.normal,
});
