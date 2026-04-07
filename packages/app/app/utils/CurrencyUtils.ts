import { format } from 'numerable';
import { en } from 'numerable/locale';

export class CurrencyUtils {
    public static getSymbol(currency: string): string {
        try {
            const parts = new Intl.NumberFormat(undefined, { style: 'currency', currency }).formatToParts(0);
            return parts.find((p) => p.type === 'currency')?.value ?? currency;
        } catch {
            return currency;
        }
    }

    public static formatWithDelimiter(
        value: string | number,
        currency: string | undefined,
        fractionDigits = 2,
        useShort: boolean = false,
    ): string {
        const num = Number(value);

        const mask = fractionDigits > 0 ? `$0,0.${'0'.repeat(fractionDigits)}` : `$0,0`;

        if (!Number.isFinite(num) || num === 0) {
            return format(0, mask, { locale: en, rounding: 'truncate', currency });
        }
        if (String(value).length > 6 && useShort) {
            return format(value, `$0a`, { locale: en, rounding: 'truncate', currency });
        }

        return format(num, mask, { locale: en, rounding: 'truncate', currency });
    }
}
