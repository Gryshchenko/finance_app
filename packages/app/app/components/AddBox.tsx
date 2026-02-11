import { Pressable, ViewStyle } from 'react-native';

import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

import { Box } from './Box/Box';

type AddBoxProps = {
    onPress?: () => void;
    icon: React.ReactNode;
};

export function AddBox({ onPress, icon }: AddBoxProps) {
    const { themed } = useAppTheme();

    return (
        <Box>
            <Pressable onPress={onPress} style={themed($addButton)}>
                {icon}
            </Pressable>

            <Text style={themed($label)}>Add</Text>
        </Box>
    );
}

const $addButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.textDim,
});

const $label: ThemedStyle<any> = ({ colors }) => ({
    fontSize: 12,
    fontWeight: '500',
    color: colors.textDim,
});
