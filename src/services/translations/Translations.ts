const Utils = require('../../utils/Utils');
const Logger = require('../../helper/logger/Logger');
const Parameter = require('./Parameter');

import { TranslationUnit } from './TranslationUnit';
import { TranslationLoader } from './TranslationLoader';

module.exports = class Translations {
    private static LOGGER: typeof Logger = Logger.Of('Translations');
    private static TEXTS: Record<string, any> = {};
    private static ENG_TEXTS: Record<string, any> = {};
    private static LANG_CODE: string;
    private static DATA: any;

    public static async load(languageCode: string, loader: TranslationLoader): Promise<{ langCode: string; data: any }> {
        if (languageCode && Translations.LANG_CODE === languageCode) {
            return Promise.resolve({
                langCode: Translations.LANG_CODE,
                data: Translations.DATA,
            });
        } else {
            Translations.LOGGER.info('Loading EN translations ...');
            Translations.TEXTS = {};
            Translations.ENG_TEXTS = {};
            const enAnswer: any = await Utils.to(Translations.loadLanguage((Translations.LANG_CODE = languageCode), loader));
            let error: any = enAnswer[0];
            if (error) {
                return Promise.reject(error);
            } else {
                Translations.DATA = enAnswer[1];
                Translations.LOGGER.info('EN translations loaded. Requested language: ' + languageCode);
                if (languageCode && languageCode !== Translations.LANG_CODE) {
                    Translations.LOGGER.info('Loading ' + languageCode + ' translations ...');
                    const langAnswer = await Utils.to(Translations.loadLanguage(languageCode, loader));
                    error = langAnswer[0];
                    if (error) {
                        Translations.LOGGER.warn(
                            `Can't load translation for language #{languageCode} Error: ${JSON.stringify(error)}`,
                        );
                    } else {
                        Translations.LANG_CODE = languageCode;
                        Translations.DATA = langAnswer[1];
                        Translations.LOGGER.info(languageCode + ' translations loaded.');
                    }
                }
                // Translations.processReferences();
                return Promise.resolve({
                    langCode: Translations.LANG_CODE,
                    data: Translations.DATA,
                });
            }
        }
    }

    private static async loadLanguage(langCode: string, loader: TranslationLoader): Promise<any> {
        const answer: any = await Utils.to(loader.load(langCode));
        const enAnswer: any = await Utils.to(loader.load('en_US'));
        const error: any = answer[0] || enAnswer[0];

        if (error) {
            return Promise.reject(error);
        } else {
            const payload = {
                translations: answer[1],
                translationsEng: enAnswer[1],
            };
            if (Utils.isNotNull(payload.translations)) {
                Object.keys(payload.translations).forEach((key: string) => {
                    Translations.TEXTS[key] = payload.translations[key];
                });
            }
            if (Utils.isNotNull(payload.translationsEng)) {
                Object.keys(payload.translationsEng).forEach((key: string) => {
                    Translations.ENG_TEXTS[key] = payload.translationsEng[key];
                });
            }

            return Promise.resolve(payload);
        }
    }

    public static text(key: string, ...parameters: (typeof Parameter)[]): string {
        return Translations.Text(key, parameters);
    }

    public static engText(key: string, ...parameters: (typeof Parameter)[]): string {
        if (Utils.isObjectEmpty(Translations.TEXTS)) {
            return key;
        } else {
            return Translations.replaceParameters(Translations.ENG_TEXTS[key], parameters) || key;
        }
    }

    public static textOf(unit: TranslationUnit): string {
        // @ts-ignore
        return Translations.Text(unit.trKey, unit.params);
    }

    public static oneOf(text?: any, unit?: TranslationUnit, key?: string, parameters?: (typeof Parameter)[]): string {
        if (Utils.isNotNull(text)) {
            return text;
        }
        if (Utils.isNotNull(unit)) {
            // @ts-ignore
            return Translations.textOf(unit);
        }
        // @ts-ignore
        return Translations.Text(key, parameters);
    }

    public static Text(key: string, parameters: (typeof Parameter)[]): string {
        if (Utils.isObjectEmpty(Translations.TEXTS)) {
            return key;
        } else {
            return Translations.textOrNull(key, parameters) || key;
        }
    }

    private static textOrNull(key: string, parameters: (typeof Parameter)[]): string {
        return (
            Translations.replaceParameters(Translations.TEXTS[key], parameters) ||
            Translations.replaceParameters(Translations.ENG_TEXTS[key], parameters)
        );
    }

    public static hasKey(key: string): boolean {
        return Utils.isNotEmpty(Translations.TEXTS[key]);
    }

    public static translationUnit(key: string, ...parameters: (typeof Parameter)[]): TranslationUnit {
        return {
            trKey: key,
            params: [...parameters],
        };
    }

    public static replaceParameters(text: string, parameters: (typeof Parameter)[]): string {
        let result: string = text;
        if (result && Utils.isArrayNotEmpty(parameters)) {
            // @ts-ignore
            parameters.forEach((parameter: Parameter) => {
                result = Utils.replaceAll(result, parameter.key, parameter.value);
            });
        }
        return result;
    }
};
