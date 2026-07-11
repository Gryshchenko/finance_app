import { Utils } from '@tenpercent/shared';
import { body, ValidationChain } from 'express-validator';

import CurrencyServiceBuilder from 'services/currency/CurrencyServiceBuilder';

/**
 * Validation rule that rejects a currencyCode which is not one of the supported
 * currencies. Produces a 400 (bad input) rather than letting the create flow fail
 * later with a 404/DB error. The exchange-rate endpoint does not use this rule and
 * keeps its own "rate not found" 404 semantics.
 */
export const createCurrencyCodeExistsRule = (optional = false): ValidationChain => {
    let chain = body('currencyCode');
    if (optional) {
        chain = chain.optional({ checkFalsy: true });
    }
    return chain.custom(async (value: string) => {
        if (Utils.isEmpty(value)) {
            // presence/format is enforced by the base currencyCode rule
            return true;
        }
        const currencies = await CurrencyServiceBuilder.build().gets();
        if (!currencies.some((currency) => currency.currencyCode === value)) {
            throw new Error('Field currencyCode is not a supported currency');
        }
        return true;
    });
};
