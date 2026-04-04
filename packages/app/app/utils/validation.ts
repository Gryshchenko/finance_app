import { Utils } from 'tenpercent/shared';

import { TxKeyPath } from '@/i18n';
import { IClientConfigLanguage } from '@/interfaces/IClientConfigLanguages';

export enum ValidationTypes {
    REQUIRED = 'validation:required',
    MAX_LENGTH = 'validation:maxLength',
    EMAIL = 'validation:email',
    EMAIL_UNIQUE = 'validation:emailAlreadyInUse',

    PASSWORD_MIN_LENGTH = 'validation:passwordMinLength',
    PASSWORD_UPPERCASE = 'validation:passwordUppercase',
    PASSWORD_LOWERCASE = 'validation:passwordLowercase',
    PASSWORD_NUMBER = 'validation:passwordNumber',
    PASSWORD_SPECIAL = 'validation:passwordSpecial',

    LANGUAGE = 'validation:unsupportedLanguage',
    CURRENCY = 'validation:unsupportedCurrency',

    NAME = 'validation:name',
    MIN_LENGTH = 'validation:minLength',

    CODE_INVALIDED = 'signUpConfirmation:validation.codeInvalided',
    CODE_REQUIRED = 'signUpConfirmation:validation.required',
    CODE_NUMBERS_ONLY = 'signUpConfirmation:validation.numbersOnly',
}

export function validateEmail(email: string | undefined): TxKeyPath | undefined {
    if (!email || email.length === 0) return ValidationTypes.REQUIRED;
    if (email.length > 50) return ValidationTypes.MAX_LENGTH;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return ValidationTypes.EMAIL;
    return undefined;
}

export function validatePassword(password: string | undefined): TxKeyPath | undefined {
    if (!password || password.length === 0) return ValidationTypes.REQUIRED;
    if (password.length < 5) return ValidationTypes.PASSWORD_MIN_LENGTH;
    if (password.length > 50) return ValidationTypes.MAX_LENGTH;
    if (!/[A-Z]/.test(password)) return ValidationTypes.PASSWORD_UPPERCASE;
    if (!/[a-z]/.test(password)) return ValidationTypes.PASSWORD_LOWERCASE;
    if (!/[0-9]/.test(password)) return ValidationTypes.PASSWORD_NUMBER;
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return ValidationTypes.PASSWORD_SPECIAL;
    return undefined;
}

export function validatePublicName(name: string | undefined): TxKeyPath | undefined {
    if (!name || name.length === 0) return ValidationTypes.REQUIRED;
    if (!/^[a-zA-Z0-9]{3,50}$/.test(name)) return ValidationTypes.NAME;
    return undefined;
}

export function validateLanguage(
    language: string | undefined,
    config: IClientConfigLanguage[] | undefined,
): TxKeyPath | undefined {
    if (!language || language.length === 0) return ValidationTypes.REQUIRED;
    const result = config?.find(({ locale }) => locale === language);
    if (Utils.isNull(result)) return ValidationTypes.LANGUAGE;
    return undefined;
}

export function validateCurrency(code: string | undefined, config: IClientConfigLanguage[] | undefined): TxKeyPath | undefined {
    if (!code || code.length === 0) return ValidationTypes.REQUIRED;
    const result = config?.find(({ currencyCode }) => currencyCode === code);
    if (Utils.isNull(result)) return ValidationTypes.CURRENCY;
    return undefined;
}

export function validateCode(confirmationCode: string | undefined): TxKeyPath | undefined {
    if (!confirmationCode) return ValidationTypes.CODE_REQUIRED;
    if (!/^[0-9]{8}$/.test(String(confirmationCode))) {
        return ValidationTypes.CODE_NUMBERS_ONLY;
    }
    return undefined;
}
