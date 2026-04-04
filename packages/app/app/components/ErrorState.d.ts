import { FC } from 'react';

import { TextProps } from '@/components/Text';

interface IProps {
    headingTx?: TextProps['tx'];
    contentTx?: TextProps['tx'];
    buttonTx?: TextProps['tx'];
    buttonOnPress?: () => void;
}
export declare const ErrorState: FC<IProps>;
export {};
