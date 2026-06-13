import { ColorId, DEFAULT_ACCOUNT_COLOR_IDS, DEFAULT_INCOME_COLOR_IDS } from 'tenpercent/shared';

export const COLOR_MAP: Record<ColorId, string> = {
    [ColorId.Black]: 'rgba(26, 26, 26, 1)', // #1A1A1A
    [ColorId.Navy]: 'rgba(44, 62, 80, 1)', // #2C3E50
    [ColorId.DarkSlate]: 'rgba(52, 73, 94, 1)', // #34495E
    [ColorId.DeepViolet]: 'rgba(142, 68, 173, 1)', // #8E44AD
    [ColorId.Teal]: 'rgba(22, 160, 133, 1)', // #16A085
    [ColorId.Green]: 'rgba(39, 174, 96, 1)', // #27AE60
    [ColorId.Pumpkin]: 'rgba(211, 84, 0, 1)', // #D35400
    [ColorId.DarkRed]: 'rgba(192, 57, 43, 1)', // #C0392B
    [ColorId.Blue]: 'rgba(46, 134, 193, 1)', // #2E86C1
    [ColorId.Gray]: 'rgba(127, 140, 141, 1)', // #7F8C8D
    [ColorId.Purple]: 'rgba(155, 89, 182, 1)', // #9B59B6
    [ColorId.Yellow]: 'rgba(241, 196, 15, 1)', // #F1C40F
    [ColorId.Orange]: 'rgba(230, 126, 34, 1)', // #E67E22
    [ColorId.Red]: 'rgba(231, 76, 60, 1)', // #E74C3C
    [ColorId.Amber]: 'rgba(243, 156, 18, 1)', // #F39C12
};

export const INCOME_COLORS = DEFAULT_INCOME_COLOR_IDS.map((colorId) => COLOR_MAP[colorId]);

export const ACCOUNT_COLORS = DEFAULT_ACCOUNT_COLOR_IDS.map((colorId) => COLOR_MAP[colorId]);

export class ColorService {
    /** Fallback for entities created before colorId was stored on the server. */
    private getDeterministicColor(id: string, colors: string[]): string {
        const hash = this.hashString(id);
        const index = hash % colors.length;
        return colors[index];
    }

    private hashString(str: string): number {
        let hash = 0;

        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }

        return Math.abs(hash);
    }

    private resolveColor(colorId?: string | null): string | undefined {
        return colorId ? COLOR_MAP[colorId as ColorId] : undefined;
    }

    public getIncomeColor(id: string, colorId?: string | null): string {
        return this.resolveColor(colorId) ?? this.getDeterministicColor(`income-${id}`, INCOME_COLORS);
    }

    public getAccountColor(id: string, colorId?: string | null): string {
        return this.resolveColor(colorId) ?? this.getDeterministicColor(`account-${id}`, ACCOUNT_COLORS);
    }
}
