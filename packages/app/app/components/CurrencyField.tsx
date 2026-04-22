import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, TextStyle, View, ViewStyle } from 'react-native';

import { FieldPresets } from '@/components/FieldPresets';
import { Text } from '@/components/Text';
import { TextField, TextFieldAccessoryProps, TextFieldProps } from '@/components/TextField';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle, ThemedStyleArray } from '@/theme/types';
import { CurrencyUtils } from '@/utils/CurrencyUtils';

export interface FieldPresetStyleMap {
    currencySymbol: ThemedStyleArray<TextStyle>;
    leftAccessoryStyle: ThemedStyleArray<ViewStyle>;
}
export interface ICurrencyField extends TextFieldProps {
    currency: string;
    onChangeCleaned: (str: string) => void;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// type MathOp = '+' | '−' | '×' | '÷' | '%' | '=';

// const MATH_OPS: MathOp[] = ['+', '−', '×', '÷', '%', '='];

// ---------------------------------------------------------------------------
// Color tokens (avoids inline color literals)
// ---------------------------------------------------------------------------

// const MATHBAR_COLORS = {
//     background: '#F2F2F7',
//     border: '#C6C6C8',
//     green: '#27AE60',
//     shadow: '#000000',
//     text: '#1C1C1E',
//     textDim: '#6e6e73',
//     white: '#FFFFFF',
// } as const;

// ---------------------------------------------------------------------------
// Safe expression evaluator — no eval / new Function on raw input
// Supports + − × ÷ with correct operator precedence (recursive descent)
// ---------------------------------------------------------------------------

// function safeEvaluate(expression: string): number | null {
//     const expr = expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').trim();
//
//     if (!expr) return null;
//     if (!/^[0-9+\-*/.() ]+$/.test(expr)) return null;
//
//     try {
//         let pos = 0;
//
//         const peek = () => expr[pos] ?? '';
//         const consume = () => expr[pos++];
//
//         const parseNumber = (): number => {
//             let s = '';
//             if (peek() === '-') s += consume();
//             while (/[0-9.]/.test(peek())) s += consume();
//             const n = parseFloat(s);
//             if (isNaN(n)) throw new Error('bad number');
//             return n;
//         };
//
//         const parseFactor = (): number => {
//             while (peek() === ' ') consume();
//             if (peek() === '(') {
//                 consume();
//                 const val = parseExpr();
//                 while (peek() === ' ') consume();
//                 if (peek() === ')') consume();
//                 return val;
//             }
//             return parseNumber();
//         };
//
//         const parseTerm = (): number => {
//             let left = parseFactor();
//             while (peek() === '*' || peek() === '/') {
//                 const op = consume();
//                 const right = parseFactor();
//                 left = op === '*' ? left * right : left / right;
//             }
//             return left;
//         };
//
//         const parseExpr = (): number => {
//             let left = parseTerm();
//             while (peek() === '+' || peek() === '-') {
//                 const op = consume();
//                 const right = parseTerm();
//                 left = op === '+' ? left + right : left - right;
//             }
//             return left;
//         };
//
//         const result = parseExpr();
//         if (!isFinite(result)) return null;
//         return Math.round(result * 1e10) / 1e10;
//     } catch {
//         return null;
//     }
// }

// ---------------------------------------------------------------------------
// Unique ID counter for InputAccessoryView nativeID
// ---------------------------------------------------------------------------

// let _idCounter = 0;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CurrencyField: FC<ICurrencyField> = ({ value, onChangeCleaned, editable, currency, ...props }) => {
    const [display, setDisplay] = useState(() => {
        if (!value) return '';
        const num = Number(value);
        return isNaN(num) ? String(value) : CurrencyUtils.formatWithDelimiter(num, undefined);
    });

    const { themed } = useAppTheme();
    // const [exprLabel, setExprLabel] = useState('');
    // const [showBar, setShowBar] = useState(false);

    const isFocused = useRef(false);
    const displayRef = useRef(display);
    const partialExprRef = useRef('');
    // const accessoryID = useRef(`currency-math-${++_idCounter}`).current;

    displayRef.current = display;

    const formatDisplay = useCallback(() => {
        const raw = displayRef.current;
        if (!raw) return;
        const num = Number(raw);
        if (!isNaN(num)) {
            setDisplay(CurrencyUtils.formatWithDelimiter(num, undefined));
        }
    }, []);

    useEffect(() => {
        if (isFocused.current) return;
        if (!value) {
            setDisplay('');
            return;
        }
        const num = Number(value);
        setDisplay(isNaN(num) ? String(value) : CurrencyUtils.formatWithDelimiter(num, undefined));
    }, [value, currency]);

    const CurrencySymbol = useMemo(
        () =>
            // eslint-disable-next-line react/display-name
            ({ style }: TextFieldAccessoryProps) => (
                <View style={style}>
                    <Text style={themed($fieldPresets[props.preset ?? 'default'].currencySymbol)}>
                        {CurrencyUtils.getSymbol(currency)}
                    </Text>
                </View>
            ),
        [currency],
    );

    const onChangeText = (text: string) => {
        const stripped = text.replace(/[^0-9.]/g, '');
        const dot = stripped.indexOf('.');
        const cleaned = dot === -1 ? stripped : stripped.slice(0, dot + 1) + stripped.slice(dot + 1).replace(/\./g, '');
        setDisplay(cleaned);
        onChangeCleaned?.(cleaned);
    };

    const onBlur = () => {
        isFocused.current = false;
        // setShowBar(false);
        formatDisplay();
        partialExprRef.current = '';
        // setExprLabel('');
    };

    const onFocus = () => {
        isFocused.current = true;
        // setShowBar(true);
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

    // ---------------------------------------------------------------------------
    // Math accessory logic
    // ---------------------------------------------------------------------------

    // const handleMathOp = useCallback(
    //     (op: MathOp) => {
    //         const currentRaw = displayRef.current.replace(/[^0-9.]/g, '');
    //
    //         // % → divide current value by 100 immediately
    //         if (op === '%') {
    //             const num = Number(currentRaw || '0');
    //             if (!isNaN(num)) {
    //                 const result = Math.round((num / 100) * 1e10) / 1e10;
    //                 const str = String(result);
    //                 setDisplay(str);
    //                 onChangeCleaned?.(str);
    //             }
    //             return;
    //         }
    //
    //         // = → evaluate accumulated expression
    //         if (op === '=') {
    //             if (!partialExprRef.current) {
    //                 formatDisplay();
    //                 return;
    //             }
    //             const operand = currentRaw || '0';
    //             const fullExpr = partialExprRef.current + operand;
    //             const result = safeEvaluate(fullExpr);
    //             if (result !== null) {
    //                 const str = String(result);
    //                 setDisplay(str);
    //                 onChangeCleaned?.(str);
    //             }
    //             partialExprRef.current = '';
    //             setExprLabel('');
    //             return;
    //         }
    //
    //         // + − × ÷ → accumulate expression, clear input for next operand
    //         if (!currentRaw && /[+\-×÷]$/.test(partialExprRef.current)) {
    //             // Replace the last operator instead of adding a duplicate
    //             partialExprRef.current = partialExprRef.current.slice(0, -1) + op;
    //             setExprLabel(partialExprRef.current);
    //             return;
    //         }
    //
    //         const operand = currentRaw || '0';
    //         partialExprRef.current += operand + op;
    //         setExprLabel(partialExprRef.current);
    //         setDisplay('');
    //     },
    //     [formatDisplay, onChangeCleaned],
    // );

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

    // const mathBar = (
    //     <View style={styles.container}>
    //         <Text style={styles.exprLabel} numberOfLines={1} ellipsizeMode="head">
    //             {exprLabel}
    //         </Text>
    //         <View style={styles.opsRow}>
    //             {MATH_OPS.map((op) => (
    //                 <TouchableOpacity
    //                     key={op}
    //                     style={[styles.opBtn, op === '=' && styles.equalBtn]}
    //                     onPress={() => handleMathOp(op)}
    //                     hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
    //                     activeOpacity={0.7}
    //                 >
    //                     <Text style={[styles.opText, op === '=' && styles.equalText]}>{op}</Text>
    //                 </TouchableOpacity>
    //             ))}
    //         </View>
    //     </View>
    // );

    return (
        <>
            <TextField
                keyboardType="decimal-pad"
                // inputAccessoryViewID={Platform.OS === 'ios' ? accessoryID : undefined}
                {...props}
                editable={editable}
                value={display}
                onChangeText={onChangeText}
                onFocus={onFocus}
                onBlur={onBlur}
                LeftAccessory={CurrencySymbol}
                leftAccessoryStyle={themed($fieldPresets[props.preset ?? 'default'].leftAccessoryStyle)}
            />

            {/*/!* iOS: bar floats above the keyboard via InputAccessoryView *!/*/}
            {/*{Platform.OS === 'ios' && <InputAccessoryView nativeID={accessoryID}>{mathBar}</InputAccessoryView>}*/}

            {/*/!* Android: bar renders inline below the field while focused *!/*/}
            {/*{Platform.OS === 'android' && showBar && mathBar}*/}
        </>
    );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

// const styles = StyleSheet.create({
//     container: {
//         alignItems: 'center',
//         backgroundColor: MATHBAR_COLORS.background,
//         borderTopColor: MATHBAR_COLORS.border,
//         borderTopWidth: StyleSheet.hairlineWidth,
//         flexDirection: 'row',
//         height: 50,
//         paddingHorizontal: 16,
//         paddingVertical: 8,
//     },
//     equalBtn: {
//         backgroundColor: MATHBAR_COLORS.green,
//         width: 46,
//     },
//     equalText: {
//         color: MATHBAR_COLORS.white,
//         fontWeight: '600',
//     },
//     exprLabel: {
//         color: MATHBAR_COLORS.textDim,
//         flex: 1,
//         fontSize: 13,
//         marginRight: 12,
//     },
//     opBtn: {
//         alignItems: 'center',
//         backgroundColor: MATHBAR_COLORS.white,
//         borderRadius: 8,
//         elevation: 2,
//         height: 34,
//         justifyContent: 'center',
//         shadowColor: MATHBAR_COLORS.shadow,
//         shadowOffset: { width: 0, height: 1 },
//         shadowOpacity: 0.12,
//         shadowRadius: 1.5,
//         width: 40,
//     },
//     opText: {
//         color: MATHBAR_COLORS.text,
//         fontSize: 18,
//         fontWeight: '500',
//     },
//     opsRow: {
//         columnGap: 6,
//         flexDirection: 'row',
//     },
// });

const $currencySymbol: ThemedStyle<TextStyle> = ({ colors }) => ({
    alignItems: 'center',
    color: colors.text,
    display: 'flex',
    fontSize: 12,
    justifyContent: 'center',
});
const $leftAccessoryStyle: ThemedStyle<TextStyle> = () => ({
    height: 40,
});

const $currencySymbolUnderlineBig: ThemedStyle<TextStyle> = ({ colors }) => ({
    alignItems: 'center',
    color: colors.text,
    display: 'flex',
    fontSize: 34,
    lineHeight: 0,
    justifyContent: 'center',
});
const $leftAccessoryStyleUnderlineBig: ThemedStyle<TextStyle> = () => ({
    height: '100%',
});

export const $fieldPresets: Record<FieldPresets, FieldPresetStyleMap> = {
    default: {
        currencySymbol: [$currencySymbol],
        leftAccessoryStyle: [$leftAccessoryStyle],
    },
    underline: {
        currencySymbol: [$currencySymbol],
        leftAccessoryStyle: [$leftAccessoryStyle],
    },
    underlineBig: {
        currencySymbol: [$currencySymbolUnderlineBig],
        leftAccessoryStyle: [$leftAccessoryStyleUnderlineBig],
    },
    filled: {
        currencySymbol: [$currencySymbol],
        leftAccessoryStyle: [$leftAccessoryStyle],
    },
    compact: {
        currencySymbol: [$currencySymbol],
        leftAccessoryStyle: [$leftAccessoryStyle],
    },
};
