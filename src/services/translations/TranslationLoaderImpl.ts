import { LanguageType } from 'types/LanguageType';
import { TranslationLoader } from 'src/services/translations/TranslationLoader';

export default class TranslationLoaderImpl implements TranslationLoader {
    private static _instance: TranslationLoader;

    public static instance(): TranslationLoader {
        return this._instance || (this._instance = new TranslationLoaderImpl());
    }

    public load(langCode: LanguageType): Promise<unknown> {
        return import(`../..locales/${langCode}.json`)
            .then((response) => response)
            .catch(() => {
                return import(`../../locales/${LanguageType.US}.json`).then((response) => response);
            });
    }
}
