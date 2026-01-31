import { FC, useState } from 'react';

import { TextField, TextFieldProps } from '@/components/TextField';
import { CurrencyUtils } from '@/utils/CurrencyUtils';

export interface ICurrencyField extends TextFieldProps {
    currency: string;
    onChangeCleaned: (str: string) => void;
}

export const CurrencyField: FC<ICurrencyField> = ({ value, onChangeCleaned, editable, currency, ...props }) => {
    const [display, setDisplay] = useState(value ? String(value) : '');
    const [_, setFocused] = useState(false);

    const onChangeText = (text: string) => {
        const cleaned: string = text.replace(/[^0-9.]/g, '');

        setDisplay(cleaned);
        onChangeCleaned?.(cleaned);
    };

    const onBlur = () => {
        setFocused(false);

        if (!display) return;

        const num = Number(display);

        if (!isNaN(num)) {
            setDisplay(CurrencyUtils.formatWithDelimiter(num, currency));
        }
    };

    const onFocus = () => {
        setFocused(true);

        if (value) setDisplay(String(value));
    };

    return (
        <TextField {...props} editable={editable} value={display} onChangeText={onChangeText} onFocus={onFocus} onBlur={onBlur} />
    );
};
