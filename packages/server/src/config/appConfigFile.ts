import { readFileSync } from 'fs';
import path from 'path';

/**
 * The public config file the clients fetch (`/public/config.json`), read once at startup
 * so validation rules can be built from the same list the clients are offered.
 *
 * Resolved against `process.cwd()` for the same reason `app.ts` mounts the static
 * directory that way: the package is started from its own root in every environment, and
 * a `__dirname`-relative path would differ between `ts-node src/` and `node dist/src/`.
 */
interface IAppConfigFile {
    version: string;
    locales: { locale: string; label: string; currencyCode: string; symbol: string }[];
    /**
     * Every currency the product supports, which is a superset of the per-locale default
     * currencies above: `locales[].currencyCode` answers "what should this locale default
     * to", not "what may a user hold". Older config files may omit it.
     */
    currencies?: string[];
    defaults: { language: string; currencyCode: string };
}

const CONFIG_PATH = path.join(process.cwd(), 'public', 'config.json');

const readAppConfigFile = (): IAppConfigFile => {
    try {
        return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) as IAppConfigFile;
    } catch (e) {
        // Failing loudly beats starting with an empty catalogue: an empty allow-list would
        // reject every currency-bearing request, and the cause would be invisible.
        throw new Error(`Unable to read ${CONFIG_PATH}: ${(e as { message: string }).message}`);
    }
};

const appConfigFile = readAppConfigFile();

/**
 * Currency codes the API accepts, as advertised to the clients.
 *
 * Falls back to the distinct per-locale defaults when `currencies` is absent, so a
 * deployment carrying an older config file still gets a closed set rather than none.
 *
 * Being in this list means the code is well-formed and offered by the product - not that
 * a rate exists for it. `createCurrencyCodeExistsRule` still checks the `currencies` table
 * for the entities that need a row there, and `/exchange-rates` still answers 404 when it
 * has no rate.
 */
export const SUPPORTED_CURRENCY_CODES: string[] = [
    ...new Set(appConfigFile.currencies ?? appConfigFile.locales.map((locale) => locale.currencyCode)),
].sort();

/** Locale tags the product ships translations for, in the order the clients list them. */
export const SUPPORTED_LOCALES: string[] = appConfigFile.locales.map((locale) => locale.locale);

export const DEFAULT_CURRENCY_CODE: string = appConfigFile.defaults.currencyCode;
