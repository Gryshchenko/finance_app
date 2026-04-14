import { Utils } from 'tenpercent/shared';

import { LoggerBase } from 'helper/logger/LoggerBase';
import { IRateProvider, IRateStatus } from 'interfaces/IRateProvider';

export class FreeCurrencyApi extends LoggerBase implements IRateProvider {
    private readonly _API_KEY: string | null = null;
    private readonly _URL: string | null = null;
    constructor(apiKey: string, url: string) {
        super();
        this._API_KEY = apiKey;
        this._URL = url;
    }

    private checkConfig() {
        if (!this._URL) {
            throw new Error('fetch URL missed pls check env configuration');
        }
        if (!this._API_KEY) {
            throw new Error('API KEY missed pls check env configuration');
        }
    }
    private buildErrorMessage(message: string, errors: Record<string, string>): string {
        let msg = `${message}`;
        if (!errors) return message;
        Object.keys(errors)?.forEach((key) => {
            msg += `: ${key} - ${errors[key]}`;
        });
        return msg;
    }
    private async getStatus(): Promise<IRateStatus> {
        try {
            this.checkConfig();
            this._logger.info('Fetch API status');
            const response = await fetch(`${this._URL}/status?apikey=${this._API_KEY}`);
            if (!response.ok) {
                const { message, errors } = await response.json();
                throw new Error(`response status: ${response.status}, ${this.buildErrorMessage(message, errors)}`);
            }
            const {
                quotas: {
                    month: { total, used, remaining },
                },
            } = await response.json();

            return {
                total: Number(total),
                used: Number(used),
                remaining: Number(remaining),
            };
        } catch (e: unknown) {
            this._logger.error(`Fetch status failed due reason: ${(e as { message: string }).message}`);
            throw e;
        }
    }
    public async getRates(base_currency: string, currencies: string[]): Promise<Record<string, number>> {
        try {
            this.checkConfig();
            if (!base_currency) {
                throw new Error('Base currency missed');
            }
            if (Utils.isArrayEmpty(currencies) || currencies.length === 0) {
                throw new Error('Currencies list missed');
            }
            this._logger.info(`Fetch currency rates for ${base_currency}, currencies count: ${currencies.length}`);
            const { remaining } = await this.getStatus();
            if (remaining <= 0) {
                throw new Error('reach monthly quotas limits');
            }
            const response = await fetch(
                `${this._URL}/latest?apikey=${this._API_KEY}&base_currency=${base_currency}&currencies=${encodeURIComponent(currencies.join(','))}`,
            );
            if (!response.ok) {
                const { message, errors } = await response.json();
                throw new Error(`response status: ${response.status}, ${this.buildErrorMessage(message, errors)}`);
            }
            const { data } = await response.json();
            if (!data || Object.keys(data).length === 0) {
                throw new Error(`currencies response is empty`);
            }
            const result: Record<string, number> = {};
            for (const currency of currencies) {
                const rate = data[currency];
                if (!isNaN(rate) && rate > 0 && rate < Number.MAX_SAFE_INTEGER) {
                    result[currency] = Number(rate);
                } else {
                    this._logger.error(`Invalid rate for currency: ${currency}, value: ${data[currency]}`);
                }
            }
            this._logger.info('Successfully fetched currency rates');
            return result as Record<string, number>;
        } catch (e: unknown) {
            this._logger.error(`Fetch rates failed due reason: ${(e as { message: string }).message}`);
            throw e;
        }
    }
}
