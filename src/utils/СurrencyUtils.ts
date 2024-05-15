import { LanguageType } from 'types/LanguageType';
import { CurrencyType } from 'types/CurrencyType';

export default class CurrencyUtils {
    public static defaultCurrencyCode = CurrencyType.USD;

    public static getCurrencyCodeFromLocale(locale: LanguageType): string | undefined {
        const formatter = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: 'USD', // temporarily
        });

        return formatter.resolvedOptions().currency;
    }
}
