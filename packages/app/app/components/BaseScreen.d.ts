import { FC } from 'react';

import { TxKeyPath } from '@/i18n';

interface BaseScreenProps {
    titleTx?: TxKeyPath | undefined;
    children: React.ReactNode;
}
export declare const BaseScreen: FC<BaseScreenProps>;
export {};
