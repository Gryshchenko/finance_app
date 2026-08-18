import { HttpCode } from '@tenpercent/shared';

import RateLimitService from '@/services/RateLimitService';
import ToastService from '@/services/ToastService';

jest.mock('@/services/ToastService', () => ({
    __esModule: true,
    default: { error: jest.fn(), warning: jest.fn() },
}));

const toastError = ToastService.error as jest.Mock;
const toastWarning = ToastService.warning as jest.Mock;

const headers = (remaining: string, reset?: string) => ({
    'x-ratelimit-limit': '5',
    'x-ratelimit-remaining': remaining,
    ...(reset === undefined ? {} : { 'x-ratelimit-reset': reset }),
});

describe('RateLimitService', () => {
    beforeEach(() => {
        toastError.mockClear();
        toastWarning.mockClear();
        RateLimitService.reset();
    });

    it('stays quiet while there is budget left', () => {
        RateLimitService.handleResponse(headers('3', '60'), HttpCode.OK);
        expect(toastWarning).not.toHaveBeenCalled();
        expect(toastError).not.toHaveBeenCalled();
    });

    it('warns once when a single attempt is left', () => {
        RateLimitService.handleResponse(headers('1', '60'), HttpCode.OK);
        expect(toastWarning).toHaveBeenCalledWith({ title: 'common:warning', message: 'rateLimit:lastAttempt' });
        expect(toastError).not.toHaveBeenCalled();
    });

    it('does not repeat the warning for the parallel requests of one screen', () => {
        RateLimitService.handleResponse(headers('1', '60'), HttpCode.OK);
        RateLimitService.handleResponse(headers('1', '60'), HttpCode.OK);
        expect(toastWarning).toHaveBeenCalledTimes(1);
    });

    it('reports a short block with the remaining wait', () => {
        RateLimitService.handleResponse(headers('0', '30'), HttpCode.TOO_MANY_REQUESTS);
        expect(toastWarning).not.toHaveBeenCalled();
        expect(toastError).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'rateLimit:blocked', txOptions: expect.any(Object) }),
        );
    });

    it('adds the clock time when the wait runs past a minute', () => {
        RateLimitService.handleResponse(headers('0', '900'), HttpCode.TOO_MANY_REQUESTS);
        const [{ message, txOptions }] = toastError.mock.calls[0];
        expect(message).toBe('rateLimit:blockedUntil');
        expect(txOptions.time).toMatch(/^\d{2}:\d{2}$/);
    });

    it('reports an exhausted budget even on an allowed response', () => {
        RateLimitService.handleResponse(headers('0', '45'), HttpCode.OK);
        expect(toastError).toHaveBeenCalledWith(expect.objectContaining({ message: 'rateLimit:blocked' }));
    });

    it('falls back to a wait-free message when the server sends no reset', () => {
        RateLimitService.handleResponse(headers('0'), HttpCode.TOO_MANY_REQUESTS);
        expect(toastError).toHaveBeenCalledWith(expect.objectContaining({ message: 'rateLimit:blockedUnknown' }));
    });

    it('still explains a 429 that arrives without any budget headers', () => {
        RateLimitService.handleResponse({ 'content-type': 'application/json' }, HttpCode.TOO_MANY_REQUESTS);
        expect(toastError).toHaveBeenCalledWith(expect.objectContaining({ message: 'rateLimit:blockedUnknown' }));
    });

    it('ignores responses from routes with no limiter', () => {
        RateLimitService.handleResponse({ 'content-type': 'application/json' }, HttpCode.OK);
        expect(toastError).not.toHaveBeenCalled();
        expect(toastWarning).not.toHaveBeenCalled();
    });
});
