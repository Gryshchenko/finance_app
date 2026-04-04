import { useState } from 'react';

import { TextField } from '@/components/TextField';
import { CurrencyUtils } from '@/utils/CurrencyUtils';

export const CurrencyField = ({ value, onChangeCleaned, editable, currency, ...props }) => {
    const [display, setDisplay] = useState(value ? String(value) : '');
    const [_, setFocused] = useState(false);
    const onChangeText = (text) => {
        const cleaned = text.replace(/[^0-9.]/g, '');
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
