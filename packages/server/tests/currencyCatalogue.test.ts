/**
 * `currencyCodeRule` accepts exactly the catalogue in `public/config.json`, so a currency
 * the database ships but the catalogue omits would be rejected at the edge while the rest
 * of the system works with it happily - which is what almost happened to GBP and CHF, both
 * seeded in `currencies` but not the default currency of any locale.
 *
 * The check reads the seeded schema rather than a live database: the invariant is between
 * two checked-in files, and the integration suite already runs at the limit of the
 * connection pool.
 */

import { readFileSync } from 'fs';
import path from 'path';

import { SUPPORTED_CURRENCY_CODES } from '../src/config/appConfigFile';

const REPO_ROOT = path.join(process.cwd(), '..', '..');

const readSeededCurrencyCodes = (): string[] => {
    const schema = readFileSync(path.join(REPO_ROOT, 'docker', 'tests', 'db', 'schema.sql'), 'utf-8');
    const insert = schema.slice(schema.indexOf('INSERT INTO public.currencies'));
    const statement = insert.slice(0, insert.indexOf(';'));
    return [...statement.matchAll(/\('([^']+)','[^']*',/g)].map((match) => match[1]);
};

const readServedConfig = () =>
    JSON.parse(readFileSync(path.join(process.cwd(), 'public', 'config.json'), 'utf-8')) as {
        currencies: string[];
        locales: { locale: string; currencyCode: string }[];
        defaults: { currencyCode: string };
    };

describe('supported currency catalogue', () => {
    it('is the list served to the clients', () => {
        expect(SUPPORTED_CURRENCY_CODES).toEqual([...readServedConfig().currencies].sort());
    });

    it('covers every currency the currencies table is seeded with', () => {
        const seeded = readSeededCurrencyCodes();

        expect(seeded.length).toBeGreaterThan(0);
        expect(SUPPORTED_CURRENCY_CODES).toEqual(expect.arrayContaining(seeded));
    });

    it('covers the currency every locale defaults to, and the global default', () => {
        const served = readServedConfig();

        expect(SUPPORTED_CURRENCY_CODES).toEqual(expect.arrayContaining(served.locales.map((locale) => locale.currencyCode)));
        expect(SUPPORTED_CURRENCY_CODES).toContain(served.defaults.currencyCode);
    });
});
