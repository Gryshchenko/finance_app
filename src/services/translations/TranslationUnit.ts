const Parameter = require('./Parameter');

export interface TranslationUnit {
    trKey?: string;
    textAlign?: any;
    params?: (typeof Parameter)[];
    customValue?: any;
}
