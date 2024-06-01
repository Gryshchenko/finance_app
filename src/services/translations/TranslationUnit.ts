import Parameter from 'src/services/translations/Parameter';

export interface TranslationUnit {
    trKey?: string;
    textAlign?: unknown;
    params?: Parameter[];
    customValue?: unknown;
}
