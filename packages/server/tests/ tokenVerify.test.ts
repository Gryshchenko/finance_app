import { Request, Response, NextFunction } from 'express';
import tokenVerify from '../src/middleware/tokenVerify';
import { HttpCode } from 'tenpercent/shared';
import { ResponseBuilderPreset } from '../src/helper/responseBuilder/ResponseBuilderPreset';
import { ErrorCode } from 'tenpercent/shared';
import TokenBlacklistBuilder from '../src/services/auth/TokenBlacklistBuilder';
import { ResponseStatusType } from 'tenpercent/shared';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const passport = require('passport');

jest.mock('passport', () => ({
    authenticate: jest.fn(),
}));

jest.mock('../src/services/auth/TokenBlacklistBuilder', () => ({
    __esModule: true,
    default: {
        build: jest.fn(),
    },
}));

describe('tokenVerify middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    let blacklistMock: any;

    beforeEach(() => {
        req = {
            headers: { authorization: 'Bearer token123' },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            end: jest.fn().mockReturnThis(),
        };
        next = jest.fn();

        blacklistMock = {
            isBlacklisted: jest.fn(),
        };

        (TokenBlacklistBuilder.build as jest.Mock).mockReturnValue(blacklistMock);
    });

    it('should return 401 if no token provided', async () => {
        // @ts-expect-error its for tests
        req.headers?.authorization = undefined;

        await tokenVerify(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(HttpCode.UNAUTHORIZED);
        expect(res.json).toHaveBeenCalledWith(ResponseBuilderPreset.getAuthError());
    });

    it('should return 401 if token is blacklisted', async () => {
        blacklistMock.isBlacklisted.mockResolvedValueOnce(true);

        await tokenVerify(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(HttpCode.UNAUTHORIZED);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                data: {},
                errors: [{ errorCode: ErrorCode.TOKEN_INVALID_ERROR }],
                status: ResponseStatusType.INTERNAL,
            }),
        );
    });

    it('should return 503 if checking blacklist throws error', async () => {
        blacklistMock.isBlacklisted.mockRejectedValueOnce(new Error('Redis down'));

        await tokenVerify(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(HttpCode.SERVICE_UNAVAILABLE);
    });

    it('should call next if token is valid and not blacklisted', async () => {
        blacklistMock.isBlacklisted.mockResolvedValueOnce(false);

        // Мокаємо passport.authenticate
        (passport.authenticate as jest.Mock).mockImplementation((_strategy, _opts, cb) => {
            return (_req: any, _res: any, _next: any) => cb(null, { userId: 1 }, null);
        });

        await tokenVerify(req as Request, res as Response, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toEqual({ userId: 1 });
    });

    it('should return 401 if passport fails authentication', async () => {
        blacklistMock.isBlacklisted.mockResolvedValueOnce(false);

        (passport.authenticate as jest.Mock).mockImplementation((_strategy, _opts, cb) => {
            return (_req: any, _res: any, _next: any) => cb(null, false, { name: 'TokenExpiredError', message: 'Expired' });
        });

        await tokenVerify(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(HttpCode.UNAUTHORIZED);
    });

    it('should return 503 if passport returns error', async () => {
        blacklistMock.isBlacklisted.mockResolvedValueOnce(false);

        (passport.authenticate as jest.Mock).mockImplementation((_strategy, _opts, cb) => {
            return (_req: any, _res: any, _next: any) => cb(new Error('System failure'), null, null);
        });

        await tokenVerify(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(HttpCode.SERVICE_UNAVAILABLE);
    });
});
