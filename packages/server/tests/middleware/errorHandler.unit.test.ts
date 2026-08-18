import { ErrorCode, HttpCode, ResponseStatusType } from '@tenpercent/shared';
import express from 'express';
import request from 'supertest';

import { errorHandler } from 'src/middleware/errorHandler';
import { notFound } from 'src/middleware/notFound';
import { ValidationError } from 'src/utils/errors/ValidationError';

const buildApp = () => {
    const app = express();
    app.use(express.json({ limit: '1kb' }));
    app.get('/known', () => {
        throw new ValidationError({ message: 'nope', errorCode: ErrorCode.EMAIL_INVALID_ERROR });
    });
    app.get('/boom', () => {
        throw new Error('secret internal detail');
    });
    app.post('/body', (req, res) => res.status(HttpCode.OK).json({ ok: true }));
    app.use(notFound);
    app.use(errorHandler);
    return app;
};

describe('notFound', () => {
    it('answers an unmatched route with the response envelope, not Express HTML', async () => {
        const response = await request(buildApp()).get('/does-not-exist');

        expect(response.status).toBe(HttpCode.NOT_FOUND);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [{ errorCode: ErrorCode.ROUTE_NOT_FOUND_ERROR }],
            status: ResponseStatusType.INTERNAL,
        });
    });
});

describe('errorHandler', () => {
    it('keeps the status and error code a BaseError carries', async () => {
        const response = await request(buildApp()).get('/known');

        expect(response.status).toBe(HttpCode.BAD_REQUEST);
        expect(response.body.errors).toStrictEqual([{ errorCode: ErrorCode.EMAIL_INVALID_ERROR }]);
    });

    it('never leaks the message or stack of an unexpected throw', async () => {
        const response = await request(buildApp()).get('/boom');

        expect(response.status).toBe(HttpCode.INTERNAL_SERVER_ERROR);
        expect(response.body).toStrictEqual({
            data: {},
            errors: [{ errorCode: ErrorCode.INTERNAL_SERVER_ERROR }],
            status: ResponseStatusType.INTERNAL,
        });
        expect(JSON.stringify(response.body)).not.toContain('secret internal detail');
    });

    it('turns malformed JSON into a 400 instead of an Express HTML page', async () => {
        const response = await request(buildApp()).post('/body').set('Content-Type', 'application/json').send('{"broken":');

        expect(response.status).toBe(HttpCode.BAD_REQUEST);
        expect(response.body.errors).toStrictEqual([{ errorCode: ErrorCode.MALFORMED_BODY_ERROR }]);
    });

    it('rejects an oversized body with a parsable response', async () => {
        const response = await request(buildApp())
            .post('/body')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify({ padding: 'x'.repeat(2048) }));

        expect(response.status).toBe(HttpCode.UNPROCESSABLE_ENTITY);
        expect(response.body.errors).toStrictEqual([{ errorCode: ErrorCode.MALFORMED_BODY_ERROR }]);
    });
});
