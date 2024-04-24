import Parameter from 'src/services/translations/Parameter';

export interface TranslationUnit {
    trKey?: string;
    textAlign?: any;
    params?: (typeof Parameter)[];
    customValue?: any;
}
