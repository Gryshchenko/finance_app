import Logger from 'src/helper/logger/Logger';

import Utils from 'src/utils/Utils';
import Parameter from 'src/services/translations/Parameter';
import { TranslationUnit } from './TranslationUnit';
import { TranslationLoader } from './TranslationLoader';

export default class Translations {
    private static LOGGER = Logger.Of('Translations');

    private static TEXTS: Record<string, string> = {};

    private static ENG_TEXTS: Record<string, string> = {};

    private static LANG_CODE: string;

    private static DATA: Record<string, string>;

    public static async load(
        languageCode: string,
        loader: TranslationLoader,
    ): Promise<{ langCode: string; data: Record<string, string> }> {
        if (languageCode && Translations.LANG_CODE === languageCode) {
            return Promise.resolve({
                langCode: Translations.LANG_CODE,
                data: Translations.DATA,
            });
        }
        Translations.LOGGER.info('Loading EN translations ...');
        Translations.TEXTS = {};
        Translations.ENG_TEXTS = {};
        const enAnswer: [unknown, unknown] = await Utils.to(
            Translations.loadLanguage((Translations.LANG_CODE = languageCode), loader),
        );
        let error: unknown = enAnswer[0];
        if (error) {
            return Promise.reject(new Error(error as string));
        }
        Translations.DATA = enAnswer[1] as Record<string, string>;
        Translations.LOGGER.info(`EN translations loaded. Requested language: ${languageCode}`);
        if (languageCode && languageCode !== Translations.LANG_CODE) {
            Translations.LOGGER.info(`Loading ${languageCode} translations ...`);
            const langAnswer = await Utils.to(Translations.loadLanguage(languageCode, loader));
            error = langAnswer[0];
            if (error) {
                Translations.LOGGER.warn(`Can't load translation for language #{languageCode} Error: ${JSON.stringify(error)}`);
            } else {
                Translations.LANG_CODE = languageCode;
                Translations.DATA = langAnswer[1] as Record<string, string>;
                Translations.LOGGER.info(`${languageCode} translations loaded.`);
            }
        }
        // Translations.processReferences();
        return Promise.resolve({
            langCode: Translations.LANG_CODE,
            data: Translations.DATA,
        });
    }

    private static async loadLanguage(
        langCode: string,
        loader: TranslationLoader,
    ): Promise<{
        translations: Record<string, string>;
        translationsEng: Record<string, string>;
    }> {
        const answer: [unknown, unknown] = await Utils.to(loader.load(langCode));
        const enAnswer: [unknown, unknown] = await Utils.to(loader.load('en_US'));
        const error: unknown = answer[0] || enAnswer[0];

        if (error) {
            return Promise.reject(new Error(error as string));
        }

        const payload = {
            translations: answer[1] as Record<string, string>,
            translationsEng: enAnswer[1] as Record<string, string>,
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

    public static text(key: string, ...parameters: Parameter[]): string {
        return Translations.Text(key, parameters);
    }

    public static Text(key: string, parameters: Parameter[]): string {
        if (Utils.isObjectEmpty(Translations.TEXTS)) {
            return key;
        }
        return Translations.textOrNull(key, parameters) || key;
    }

    private static textOrNull(key: string, parameters: Parameter[]): string {
        return (
            Translations.replaceParameters(Translations.TEXTS[key], parameters) ||
            Translations.replaceParameters(Translations.ENG_TEXTS[key], parameters)
        );
    }

    public static hasKey(key: string): boolean {
        return Utils.isNotEmpty(Translations.TEXTS[key]);
    }

    public static translationUnit(key: string, ...parameters: Parameter[]): TranslationUnit {
        return {
            trKey: key,
            params: [...parameters],
        };
    }

    public static replaceParameters(text: string, parameters: Parameter[]): string {
        let result: string = text;
        if (result && Utils.isArrayNotEmpty(parameters)) {
            parameters.forEach((parameter: Parameter) => {
                result = Utils.replaceAll(result, parameter.key, parameter.value as string);
            });
        }
        return result;
    }
}
