import { LanguageType } from 'types/LanguageType';

export default class TranslationsUtils {
    public static convertToSupportLocale(locale: string): LanguageType {
        switch (locale) {
            case LanguageType.DE:
                return LanguageType.DE;
            case LanguageType.DK:
                return LanguageType.DK;
            case LanguageType.ES:
                return LanguageType.ES;
            case LanguageType.FI:
                return LanguageType.FI;
            case LanguageType.FR:
                return LanguageType.FR;
            case LanguageType.GR:
                return LanguageType.GR;
            case LanguageType.IT:
                return LanguageType.IT;
            case LanguageType.NL:
                return LanguageType.NL;
            case LanguageType.NO:
                return LanguageType.NO;
            case LanguageType.PT:
                return LanguageType.PT;
            case LanguageType.RU:
                return LanguageType.RU;
            case LanguageType.SE:
                return LanguageType.SE;
            case LanguageType.UA:
                return LanguageType.UA;
            case LanguageType.US:
                return LanguageType.US;
            case LanguageType.BG:
                return LanguageType.BG;
            case LanguageType.CS:
                return LanguageType.CS;
            case LanguageType.HR:
                return LanguageType.HR;
            case LanguageType.HU:
                return LanguageType.HU;
            case LanguageType.KA:
                return LanguageType.KA;
            case LanguageType.PL:
                return LanguageType.PL;
            case LanguageType.BR:
                return LanguageType.BR;
            case LanguageType.RO:
                return LanguageType.RO;
            case LanguageType.SK:
                return LanguageType.SK;
            case LanguageType.SL:
                return LanguageType.SL;
            case LanguageType.TR:
                return LanguageType.TR;
            case LanguageType.LV:
                return LanguageType.LV;
            default:
                return LanguageType.US;
        }
    }
}
