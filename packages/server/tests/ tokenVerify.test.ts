import { Request, Response, NextFunction } from 'express';
import tokenVerify from '../src/middleware/tokenVerify';
import { HttpCode, ErrorCode, ResponseStatusType } from 'tenpercent/shared';
import TokenBlacklistBuilder from '../src/services/auth/TokenBlacklistBuilder';

import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(),
}));

jest.mock('../src/services/auth/TokenBlacklistBuilder', () => ({
    __esModule: true,
    default: {
        build: jest.fn(),
    },
}));

jest.mock('../src/services/user/UserServiceBuilder', () => {
    const mockUserService = {
        get: jest.fn(),
    };
    return {
        __esModule: true,
        default: {
            build: jest.fn(() => mockUserService),
        },
        _mockUserService: mockUserService,
    };
});

jest.mock('../src/config/config', () => ({
    getConfig: jest.fn(() => ({
        jwtSecret: 'test-secret',
        jwtAlgorithm: 'HS256',
        jwtIssuer: 'test-issuer',
        jwtAudience: 'test-audience',
    })),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { _mockUserService } = require('../src/services/user/UserServiceBuilder');

describe('tokenVerify middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    let blacklistMock: { isBlacklisted: jest.Mock };

    beforeEach(() => {
        req = {
            headers: { authorization: 'Bearer token123' },
            params: {},
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
        jest.clearAllMocks();
        (TokenBlacklistBuilder.build as jest.Mock).mockReturnValue(blacklistMock);
    });

    it('should return 401 if no token provided', async () => {
        req.headers = {};

        await tokenVerify(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(HttpCode.UNAUTHORIZED);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                errors: [{ errorCode: ErrorCode.TOKEN_INVALID_ERROR }],
                status: ResponseStatusType.INTERNAL,
            }),
        );
    });

    it('should return 401 if token is blacklisted', async () => {
        blacklistMock.isBlacklisted.mockResolvedValueOnce(true);

        await tokenVerify(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(HttpCode.UNAUTHORIZED);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                errors: [{ errorCode: ErrorCode.TOKEN_INVALID_ERROR }],
                status: ResponseStatusType.INTERNAL,
            }),
        );
    });

    it('should return 401 if checking blacklist throws error', async () => {
        blacklistMock.isBlacklisted.mockRejectedValueOnce(new Error('Redis down'));

        await tokenVerify(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(HttpCode.UNAUTHORIZED);
    });

    it('should call next if token is valid and not blacklisted', async () => {
        blacklistMock.isBlacklisted.mockResolvedValueOnce(false);
        (jwt.verify as jest.Mock).mockReturnValueOnce({ sub: '1', purpose: 'access' });
        _mockUserService.get.mockResolvedValueOnce({ userId: 1 });

        await tokenVerify(req as Request, res as Response, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toEqual({ userId: 1 });
    });

    it('should return 401 if jwt verification fails', async () => {
        blacklistMock.isBlacklisted.mockResolvedValueOnce(false);
        (jwt.verify as jest.Mock).mockImplementationOnce(() => {
            throw new Error('invalid signature');
        });

        await tokenVerify(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(HttpCode.UNAUTHORIZED);
    });

    it('should return 401 if token purpose does not match', async () => {
        blacklistMock.isBlacklisted.mockResolvedValueOnce(false);
        (jwt.verify as jest.Mock).mockReturnValueOnce({ sub: '1', purpose: 'refresh' });

        await tokenVerify(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(HttpCode.UNAUTHORIZED);
    });

    it('should return 401 if user not found during lookup', async () => {
        blacklistMock.isBlacklisted.mockResolvedValueOnce(false);
        (jwt.verify as jest.Mock).mockReturnValueOnce({ sub: '999', purpose: 'access' });
        _mockUserService.get.mockResolvedValueOnce(null);

        await tokenVerify(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(HttpCode.UNAUTHORIZED);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                errors: [{ errorCode: ErrorCode.TOKEN_PAYLOAD_ERROR }],
            }),
        );
    });
});
