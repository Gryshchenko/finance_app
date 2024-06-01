export interface TranslationLoader {
    load(langCode: string): Promise<{
        translations: Record<string, string>;
        translationsEng: Record<string, string>;
    }>;
}
