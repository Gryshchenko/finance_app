import { MMKVStorage } from '@/services/MMKVStorage';

export const INCOME_COLORS = [
    'rgba(39, 174, 96, 1)', // green
    'rgba(46, 134, 193, 1)', // blue
    'rgba(155, 89, 182, 1)', // purple
    'rgba(241, 196, 15, 1)', // yellow
    'rgba(230, 126, 34, 1)', // orange
    'rgba(231, 76, 60, 1)', // red
    'rgba(52, 73, 94, 1)', // dark slate
    'rgba(22, 160, 133, 1)', // teal
    'rgba(142, 68, 173, 1)', // deep violet
    'rgba(243, 156, 18, 1)', // amber
];

export const ACCOUNT_COLORS = [
    'rgba(26, 26, 26, 1)', // #1A1A1A
    'rgba(44, 62, 80, 1)', // #2C3E50
    'rgba(52, 73, 94, 1)', // #34495E
    'rgba(142, 68, 173, 1)', // #8E44AD
    'rgba(22, 160, 133, 1)', // #16A085
    'rgba(39, 174, 96, 1)', // #27AE60
    'rgba(211, 84, 0, 1)', // #D35400
    'rgba(192, 57, 43, 1)', // #C0392B
    'rgba(46, 134, 193, 1)', // #2E86C1
    'rgba(127, 140, 141, 1)', // #7F8C8D
];
export class ColorService {
    private readonly storage = new MMKVStorage();

    private getDeterministicColor(id: string, colors: string[]): string {
        const cachedColor = this.storage.get<string>(id);
        if (cachedColor) {
            return cachedColor;
        }

        const hash = this.hashString(id);
        const index = hash % colors.length;
        const color = colors[index];

        this.storage.set(id, color);
        return color;
    }

    private hashString(str: string): number {
        let hash = 0;

        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }

        return Math.abs(hash);
    }

    public getIncomeColor(id: string): string {
        return this.getDeterministicColor(`income-${id}`, INCOME_COLORS);
    }

    public getAccountColor(id: string): string {
        return this.getDeterministicColor(`account-${id}`, ACCOUNT_COLORS);
    }
}
