import { ErrorCode, HttpCode } from '@tenpercent/shared';

import { captureError, isReportableError } from 'src/utils/captureError';
import { BaseError } from 'src/utils/errors/BaseError';
import { ValidationError } from 'src/utils/errors/ValidationError';

jest.mock('@sentry/node', () => ({
    captureException: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Sentry = require('@sentry/node');

describe('isReportableError', () => {
    it('reports a plain Error, because nothing modelled it', () => {
        expect(isReportableError(new Error('driver exploded'))).toBe(true);
    });

    it('reports a non-Error throw', () => {
        expect(isReportableError('just a string')).toBe(true);
    });

    it('ignores a 4xx, which is the client being told it got the request wrong', () => {
        const error = new ValidationError({ message: 'bad email', errorCode: ErrorCode.EMAIL_INVALID_ERROR });

        expect(isReportableError(error)).toBe(false);
    });

    it('reports a 5xx a BaseError raised deliberately', () => {
        const error = new BaseError({
            message: 'store failed',
            statusCode: HttpCode.INTERNAL_SERVER_ERROR,
            errorCode: ErrorCode.CANT_STORE_DATA,
        });

        expect(isReportableError(error)).toBe(true);
    });
});

describe('captureError', () => {
    beforeEach(() => jest.clearAllMocks());

    it('sends the errors worth an event, tagged with their source', () => {
        const error = new Error('boom');

        captureError(error, { errorCode: ErrorCode.CANT_STORE_DATA, source: 'controller' });

        expect(Sentry.captureException).toHaveBeenCalledWith(error, {
            tags: { error_code: String(ErrorCode.CANT_STORE_DATA), source: 'controller' },
        });
    });

    it('sends nothing for ordinary client failure', () => {
        captureError(new ValidationError({ message: 'bad email', errorCode: ErrorCode.EMAIL_INVALID_ERROR }));

        expect(Sentry.captureException).not.toHaveBeenCalled();
    });
});
