import { LanguageType } from 'types/LanguageType';
import { CurrencyType } from 'types/CurrencyType';

export default class CurrencyUtils {
    public static defaultCurrencyCode = CurrencyType.USD;

    public static getCurrencyCodeFromLocale(locale: LanguageType, currency: string): string | undefined {
        const formatter = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
        });

        return formatter.resolvedOptions().currency;
    }
    public static getCurrencyForLocale(locale: LanguageType): string {
        return CurrencyUtils.localeToCurrency[locale] ?? CurrencyUtils.localeToCurrency[LanguageType.US];
    }
    private static localeToCurrency: { [key in LanguageType]: string } = {
        [LanguageType.DK]: 'DKK',
        [LanguageType.GR]: 'EUR',
        [LanguageType.DE]: 'EUR',
        [LanguageType.US]: 'USD',
        [LanguageType.ES]: 'EUR',
        [LanguageType.ET]: 'EUR',
        [LanguageType.FI]: 'EUR',
        [LanguageType.FR]: 'EUR',
        [LanguageType.IT]: 'EUR',
        [LanguageType.NL]: 'EUR',
        [LanguageType.NO]: 'NOK',
        [LanguageType.PT]: 'EUR',
        [LanguageType.SE]: 'SEK',
        [LanguageType.UA]: 'UAH',
        [LanguageType.RU]: 'RUB',
        [LanguageType.BG]: 'BGN',
        [LanguageType.CS]: 'CZK',
        [LanguageType.HR]: 'HRK',
        [LanguageType.HU]: 'HUF',
        [LanguageType.JA]: 'JPY',
        [LanguageType.KA]: 'GEL',
        [LanguageType.PL]: 'PLN',
        [LanguageType.BR]: 'BRL',
        [LanguageType.RO]: 'RON',
        [LanguageType.SK]: 'EUR',
        [LanguageType.SL]: 'EUR',
        [LanguageType.TR]: 'TRY',
        [LanguageType.LV]: 'EUR',
    };
}
