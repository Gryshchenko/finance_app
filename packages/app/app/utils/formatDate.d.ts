import { format } from 'date-fns/format';

type Options = Parameters<typeof format>[2];
export declare const loadDateFnsLocale: () => void;
export declare const formatDate: (date: string, dateFormat?: string, options?: Options) => string;
export {};
