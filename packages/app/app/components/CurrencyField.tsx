import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';

import { TextField, TextFieldProps } from '@/components/TextField';
import { CurrencyUtils } from '@/utils/CurrencyUtils';

export interface ICurrencyField extends TextFieldProps {
    currency: string;
    onChangeCleaned: (str: string) => void;
}

export const CurrencyField: FC<ICurrencyField> = ({ value, onChangeCleaned, editable, currency, ...props }) => {
    const [display, setDisplay] = useState(value ? String(value) : '');
    const isFocused = useRef(false);
    const displayRef = useRef(display);

    displayRef.current = display;

    const formatDisplay = useCallback(() => {
        const raw = displayRef.current;
        if (!raw) return;

        const num = Number(raw);
        if (!isNaN(num)) {
            setDisplay(CurrencyUtils.formatWithDelimiter(num, currency));
        }
    }, [currency]);

    const onChangeText = (text: string) => {
        const cleaned: string = text.replace(/[^0-9.]/g, '');

        setDisplay(cleaned);
        onChangeCleaned?.(cleaned);
    };

    const onBlur = () => {
        isFocused.current = false;
        formatDisplay();
    };

    const onFocus = () => {
        isFocused.current = true;
        if (value) setDisplay(String(value));
    };

    useEffect(() => {
        const sub = Keyboard.addListener('keyboardDidHide', () => {
            if (isFocused.current) {
                isFocused.current = false;
                formatDisplay();
            }
        });
        return () => sub.remove();
    }, [formatDisplay]);

    return (
        <TextField {...props} editable={editable} value={display} onChangeText={onChangeText} onFocus={onFocus} onBlur={onBlur} />
    );
};
