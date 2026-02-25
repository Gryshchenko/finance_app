import { format } from 'd3-format';

const compact = format('.2s');

export class CurrencyUtils {
    public static formatWithDelimiter(value: string | number, currency: string, fractionDigits = 2): string {
        const num = Number(value);
        const normal = String(num);

        if (!Number.isFinite(num)) {
            return '0';
        }

        if (normal.length > 6) {
            return compact(num);
        }

        return `${currency} ${num.toLocaleString('en-US', {
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits,
        })}`;
    }
}
