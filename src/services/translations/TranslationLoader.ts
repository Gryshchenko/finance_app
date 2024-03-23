export interface TranslationLoader {
    load(langCode: string): Promise<any>;
}
