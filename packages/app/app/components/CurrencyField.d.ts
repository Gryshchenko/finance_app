import { FC } from 'react';

import { TextFieldProps } from '@/components/TextField';

export interface ICurrencyField extends TextFieldProps {
    currency: string;
    onChangeCleaned: (str: string) => void;
}
export declare const CurrencyField: FC<ICurrencyField>;
