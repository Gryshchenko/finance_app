import { FC } from 'react';
// eslint-disable-next-line no-restricted-imports
import { TextStyle } from 'react-native';

import { Text } from '@/components/Text';
import { TxKeyPath } from '@/i18n/index';
import { colors } from '@/theme/colors';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';

interface HeaderTitleProps {
    subLogoText: TxKeyPath;
}

export const HeaderTitle: FC<HeaderTitleProps> = ({ subLogoText }) => {
    const { themed } = useAppTheme();
    return (
        <>
            <Text text={'TENPERCENT'} preset="heading" style={themed($logo)} />
            <Text tx={subLogoText} preset="heading" style={themed($subLogo)} />
        </>
    );
};

const $logo: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
    fontSize: 20, // 1.25rem = 20px
    lineHeight: 28, // 1.75rem = 28px
    letterSpacing: 2, // 0.1em * 20px = 2px
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.palette.neutral900,
    textAlign: 'center',
    fontFamily: typography.fonts.funnelSans.bold,
});

const $subLogo: ThemedStyle<TextStyle> = ({ typography }) => ({
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '500',
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 14,
    color: colors.textDim,
    fontFamily: typography.fonts.funnelSans.semiBold,
});
