import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';

import { TextField, TextFieldProps } from '@/components/TextField';
import { CurrencyUtils } from '@/utils/CurrencyUtils';

export interface ICurrencyField extends TextFieldProps {
    currency: string;
    onChangeCleaned: (str: string) => void;
}

export const CurrencyField: FC<ICurrencyField> = ({ value, onChangeCleaned, editable, currency, ...props }) => {
    const [display, setDisplay] = useState(() => {
        if (!value) return '';
        const num = Number(value);
        return isNaN(num) ? String(value) : CurrencyUtils.formatWithDelimiter(num, currency);
    });
    const isFocused = useRef(false);
    const displayRef = useRef(display);

    displayRef.current = display;

    const formatDisplay = useCallback(() => {
        const raw = displayRef.current;
        if (!raw) return;

        const num = Number(raw);
        if (!isNaN(num)) {
            console.log(currency);
            setDisplay(CurrencyUtils.formatWithDelimiter(num, currency));
        }
    }, [currency]);

    // Sync with external value changes (only when not focused to avoid fighting the user)
    useEffect(() => {
        if (isFocused.current) return;

        if (!value) {
            setDisplay('');
            return;
        }

        const num = Number(value);
        setDisplay(isNaN(num) ? String(value) : CurrencyUtils.formatWithDelimiter(num, currency));
    }, [value, currency]);

    const onChangeText = (text: string) => {
        const stripped = text.replace(/[^0-9.]/g, '');
        // Keep only the first dot
        const dot = stripped.indexOf('.');
        const cleaned = dot === -1 ? stripped : stripped.slice(0, dot + 1) + stripped.slice(dot + 1).replace(/\./g, '');

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
        <TextField
            keyboardType="decimal-pad"
            {...props}
            editable={editable}
            value={display}
            onChangeText={onChangeText}
            onFocus={onFocus}
            onBlur={onBlur}
        />
    );
};
