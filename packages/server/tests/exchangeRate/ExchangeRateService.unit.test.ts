import ExchangeRateService from 'services/exchangeRateService/ExchangeRateService';
import RateProviderBuilder from 'services/exchangeRateService/providers/RateProviderBuilder';
import { IExchangeRateDataAccess } from 'services/exchangeRateService/ExchangeRateDataAccess';
import { ICurrency, Time } from 'tenpercent/shared';
import { IRate } from 'tenpercent/shared/dist/interfaces/IRate';

const currencies: ICurrency[] = [
    {
        currencyCode: 'USD',
        symbol: '$',
        currencyName: 'US dollar',
    },
    {
        currencyCode: 'EUR',
        symbol: '€',
        currencyName: 'Euro',
    },
];

const mockRateProvider = {
    getRates: jest.fn<Promise<Record<string, number>>, [string, string[]]>(),
};

const mockDataAccess: jest.Mocked<IExchangeRateDataAccess> = {
    get: jest.fn(),
    gets: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
};

const makeRate = (baseCurrency: string, targetCurrency: string, hoursOld = 0): IRate => ({
    baseCurrency,
    targetCurrency,
    rate: 1.23,
    updatedAt: new Date(Date.now() - hoursOld * 60 * 60 * 1000),
});

let service: ExchangeRateService;
let getDiffSpy: jest.SpyInstance;

beforeEach(() => {
    jest.clearAllMocks();

    // Prevent RateProviderBuilder.build() from calling getConfig() / reading env vars
    jest.spyOn(RateProviderBuilder, 'build').mockReturnValue(mockRateProvider as never);

    // Default: rates are fresh (getDiff returns 0 hours)
    getDiffSpy = jest.spyOn(Time, 'getDiff').mockReturnValue(0);

    service = new ExchangeRateService(mockDataAccess);
});

afterEach(() => {
    getDiffSpy.mockRestore();
});

describe('get', () => {
    it('delegates to dataAccess.get and returns the result', async () => {
        const rate = makeRate('USD', 'EUR');
        mockDataAccess.get.mockResolvedValue(rate);

        const result = await service.get('USD', 'EUR');

        expect(mockDataAccess.get).toHaveBeenCalledTimes(1);
        expect(mockDataAccess.get).toHaveBeenCalledWith('USD', 'EUR');
        expect(result).toBe(rate);
    });

    it('returns undefined when dataAccess.get returns undefined', async () => {
        mockDataAccess.get.mockResolvedValue(undefined);

        const result = await service.get('USD', 'XYZ');

        expect(result).toBeUndefined();
    });

    it('propagates errors thrown by dataAccess.get', async () => {
        const error = new Error('DB failure');
        mockDataAccess.get.mockRejectedValue(error);

        await expect(service.get('USD', 'EUR')).rejects.toThrow('DB failure');
    });
});

describe('gets', () => {
    it('delegates to dataAccess.gets and returns the result', async () => {
        const rates = [makeRate('USD', 'EUR'), makeRate('USD', 'GBP')];
        mockDataAccess.gets.mockResolvedValue(rates);

        const result = await service.gets('USD');

        expect(mockDataAccess.gets).toHaveBeenCalledTimes(1);
        expect(mockDataAccess.gets).toHaveBeenCalledWith('USD');
        expect(result).toBe(rates);
    });

    it('returns undefined when dataAccess.gets returns undefined', async () => {
        mockDataAccess.gets.mockResolvedValue(undefined);

        const result = await service.gets('USD');

        expect(result).toBeUndefined();
    });

    it('propagates errors thrown by dataAccess.gets', async () => {
        mockDataAccess.gets.mockRejectedValue(new Error('Connection lost'));

        await expect(service.gets('USD')).rejects.toThrow('Connection lost');
    });
});

describe('post', () => {
    it('delegates to dataAccess.post and returns true on success', async () => {
        mockDataAccess.post.mockResolvedValue(true);

        const result = await service.post('USD', { EUR: 0.92, GBP: 0.79 });

        expect(mockDataAccess.post).toHaveBeenCalledTimes(1);
        expect(mockDataAccess.post).toHaveBeenCalledWith('USD', { EUR: 0.92, GBP: 0.79 });
        expect(result).toBe(true);
    });

    it('returns false when dataAccess.post returns false', async () => {
        mockDataAccess.post.mockResolvedValue(false);

        const result = await service.post('USD', { EUR: 0.92 });

        expect(result).toBe(false);
    });

    it('propagates errors thrown by dataAccess.post', async () => {
        mockDataAccess.post.mockRejectedValue(new Error('Insert failed'));

        await expect(service.post('USD', { EUR: 0.92 })).rejects.toThrow('Insert failed');
    });
});

describe('patch', () => {
    it('delegates to dataAccess.patch and returns true on success', async () => {
        mockDataAccess.patch.mockResolvedValue(true);

        const result = await service.patch('USD', { EUR: 0.91 });

        expect(mockDataAccess.patch).toHaveBeenCalledTimes(1);
        expect(mockDataAccess.patch).toHaveBeenCalledWith('USD', { EUR: 0.91 });
        expect(result).toBe(true);
    });

    it('returns false when dataAccess.patch returns false', async () => {
        mockDataAccess.patch.mockResolvedValue(false);

        const result = await service.patch('USD', { EUR: 0.91 });

        expect(result).toBe(false);
    });

    it('propagates errors thrown by dataAccess.patch', async () => {
        mockDataAccess.patch.mockRejectedValue(new Error('Update failed'));

        await expect(service.patch('USD', { EUR: 0.91 })).rejects.toThrow('Update failed');
    });
});

describe('syncCurrenciesRates', () => {
    it('does nothing when the currency list is empty', async () => {
        await service.syncCurrenciesRates([]);

        expect(mockDataAccess.gets).not.toHaveBeenCalled();
        expect(mockRateProvider.getRates).not.toHaveBeenCalled();
        expect(mockDataAccess.post).not.toHaveBeenCalled();
        expect(mockDataAccess.patch).not.toHaveBeenCalled();
    });

    it('inserts a full rate set when no existing rates are found', async () => {
        // No existing rates for either currency → both get inserted with the full code set.
        mockDataAccess.gets.mockResolvedValue([]);
        mockRateProvider.getRates.mockResolvedValue({ EUR: 0.92, USD: 1 });
        mockDataAccess.post.mockResolvedValue(true);

        await service.syncCurrenciesRates(currencies);

        expect(mockRateProvider.getRates).toHaveBeenCalledWith('USD', ['USD', 'EUR']);
        expect(mockDataAccess.post).toHaveBeenCalledWith('USD', { EUR: 0.92, USD: 1 });
    });

    it('does not call getRates or patch when all existing rates are fresh', async () => {
        // Two fresh rates
        mockDataAccess.gets.mockResolvedValue([makeRate('USD', 'EUR'), makeRate('USD', 'GBP')]);
        // getDiff returns 0 → not outdated (default mock)

        await service.syncCurrenciesRates(currencies);

        expect(mockRateProvider.getRates).not.toHaveBeenCalled();
        expect(mockDataAccess.patch).not.toHaveBeenCalled();
        expect(mockDataAccess.post).not.toHaveBeenCalled();
    });

    it('patches only outdated target currencies', async () => {
        getDiffSpy.mockImplementation(({ to }: { to: Date }) => {
            // Simulate: EUR is outdated (14h), GBP is fresh (2h)
            return to.getTime() < Date.now() - 12 * 60 * 60 * 1000 ? 14 : 2;
        });

        mockDataAccess.gets.mockResolvedValue([
            { ...makeRate('USD', 'EUR'), updatedAt: new Date(Date.now() - 14 * 60 * 60 * 1000) },
            { ...makeRate('USD', 'GBP'), updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        ]);
        mockRateProvider.getRates.mockResolvedValue({ EUR: 0.91 });
        mockDataAccess.patch.mockResolvedValue(true);

        await service.syncCurrenciesRates(currencies);

        // Only EUR was outdated → getRates called with only ['EUR']
        expect(mockRateProvider.getRates).toHaveBeenCalledWith('USD', ['EUR']);
        expect(mockDataAccess.patch).toHaveBeenCalledWith('USD', { EUR: 0.91 });
        expect(mockDataAccess.post).not.toHaveBeenCalled();
    });

    it('patches all targets when every existing rate is outdated', async () => {
        // All getDiff calls return 13 → all outdated
        getDiffSpy.mockReturnValue(13);

        mockDataAccess.gets.mockResolvedValue([makeRate('USD', 'EUR'), makeRate('USD', 'GBP'), makeRate('USD', 'JPY')]);
        mockRateProvider.getRates.mockResolvedValue({ EUR: 0.91, GBP: 0.79, JPY: 149.5 });
        mockDataAccess.patch.mockResolvedValue(true);

        await service.syncCurrenciesRates(currencies);

        expect(mockRateProvider.getRates).toHaveBeenCalledWith('USD', ['EUR', 'GBP', 'JPY']);
        expect(mockDataAccess.patch).toHaveBeenCalledWith('USD', { EUR: 0.91, GBP: 0.79, JPY: 149.5 });
    });

    it('processes each currency independently', async () => {
        // USD has no existing rates → will insert
        // EUR has outdated rates → will patch
        mockDataAccess.gets
            .mockResolvedValueOnce([]) // USD: no existing rates
            .mockResolvedValueOnce([makeRate('EUR', 'USD')]); // EUR: one existing rate

        getDiffSpy.mockReturnValueOnce(14); // EUR rate is 14h old → outdated (USD has no existing rates so getDiff is not called for it)

        mockRateProvider.getRates
            .mockResolvedValueOnce({ EUR: 0.92, USD: 1 }) // for USD insert
            .mockResolvedValueOnce({ USD: 1.08 }); // for EUR patch

        mockDataAccess.post.mockResolvedValue(true);
        mockDataAccess.patch.mockResolvedValue(true);

        await service.syncCurrenciesRates(currencies);

        expect(mockDataAccess.post).toHaveBeenCalledWith('USD', { EUR: 0.92, USD: 1 });
        expect(mockDataAccess.patch).toHaveBeenCalledWith('EUR', { USD: 1.08 });
    });

    it('does not re-throw when rateProvider.getRates() throws', async () => {
        mockDataAccess.gets.mockResolvedValue([]);
        mockRateProvider.getRates.mockRejectedValue(new Error('API quota exceeded'));

        await expect(service.syncCurrenciesRates(currencies)).resolves.toBeUndefined();

        expect(mockDataAccess.post).not.toHaveBeenCalled();
    });

    it('does not re-throw when dataAccess.post throws', async () => {
        mockDataAccess.gets.mockResolvedValue([]);
        mockRateProvider.getRates.mockResolvedValue({ EUR: 0.92 });
        mockDataAccess.post.mockRejectedValue(new Error('Insert constraint violation'));

        await expect(service.syncCurrenciesRates(currencies)).resolves.toBeUndefined();
    });

    it('does not re-throw when dataAccess.patch throws', async () => {
        getDiffSpy.mockReturnValue(13); // all rates outdated

        mockDataAccess.gets.mockResolvedValue([makeRate('USD', 'EUR')]);
        mockRateProvider.getRates.mockResolvedValue({ EUR: 0.91 });
        mockDataAccess.patch.mockRejectedValue(new Error('Lock timeout'));

        await expect(service.syncCurrenciesRates(currencies)).resolves.toBeUndefined();
    });

    it('continues to the next currency after one fails', async () => {
        // USD fetch throws; EUR succeeds
        mockDataAccess.gets.mockRejectedValueOnce(new Error('Timeout')).mockResolvedValueOnce([]);

        mockRateProvider.getRates.mockResolvedValue({ USD: 1 });
        mockDataAccess.post.mockResolvedValue(true);

        await expect(service.syncCurrenciesRates(currencies)).resolves.toBeUndefined();

        // Despite USD failure the overall call must not throw
        // EUR should have been processed (gets called for EUR → no rates → post)
        expect(mockDataAccess.post).toHaveBeenCalledWith('EUR', { USD: 1 });
    });

    describe('logAndStoreRates - result logging', () => {
        it('completes without throwing when post returns false (logs error internally)', async () => {
            mockDataAccess.gets.mockResolvedValue([]);
            mockRateProvider.getRates.mockResolvedValue({ EUR: 0.92 });
            // post returns false → service logs an error but must not throw
            mockDataAccess.post.mockResolvedValue(false);

            await expect(service.syncCurrenciesRates(currencies)).resolves.toBeUndefined();
        });

        it('completes without throwing when patch returns false (logs error internally)', async () => {
            getDiffSpy.mockReturnValue(13); // all rates outdated

            mockDataAccess.gets.mockResolvedValue([makeRate('USD', 'EUR')]);
            mockRateProvider.getRates.mockResolvedValue({ EUR: 0.91 });
            // patch returns false → service logs an error but must not throw
            mockDataAccess.patch.mockResolvedValue(false);

            await expect(service.syncCurrenciesRates(currencies)).resolves.toBeUndefined();
        });
    });
});
