export class CurrencyUtils {
    public static formatWithDelimiter(value: string | number, currency: string, fractionDigits = 2): string {
        const num = Number(value);

        if (!Number.isFinite(num)) {
            return '0';
        }

        return `${currency} ${num.toLocaleString('en-US', {
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits,
        })}`;
    }
}
