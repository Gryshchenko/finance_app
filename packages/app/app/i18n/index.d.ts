import 'intl-pluralrules';
import { Translations } from './en';

export declare let isRTL: boolean;
export declare const initI18n: () => Promise<import('i18next').i18n>;
/**
 * Builds up valid keypaths for translations.
 */
export type TxKeyPath = RecursiveKeyOf<Translations>;
type RecursiveKeyOf<TObj extends object> = {
    [TKey in keyof TObj & (string | number)]: RecursiveKeyOfHandleValue<TObj[TKey], `${TKey}`, true>;
}[keyof TObj & (string | number)];
type RecursiveKeyOfInner<TObj extends object> = {
    [TKey in keyof TObj & (string | number)]: RecursiveKeyOfHandleValue<TObj[TKey], `${TKey}`, false>;
}[keyof TObj & (string | number)];
type RecursiveKeyOfHandleValue<TValue, Text extends string, IsFirstLevel extends boolean> = TValue extends any[]
    ? Text
    : TValue extends object
      ? IsFirstLevel extends true
          ? Text | `${Text}:${RecursiveKeyOfInner<TValue>}`
          : Text | `${Text}.${RecursiveKeyOfInner<TValue>}`
      : Text;
export {};
