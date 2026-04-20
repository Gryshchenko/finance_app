import jwt from 'jsonwebtoken';
import { getConfig } from '../src/config/config';
import { tokenLongVerify } from '../src/middleware/tokenVerify';
import { HttpCode } from 'tenpercent/shared';
import { ErrorCode } from 'tenpercent/shared';
import { ResponseStatusType } from 'tenpercent/shared';
import TokenBlacklistBuilder from '../src/services/auth/TokenBlacklistBuilder';
import UserServiceBuilder from '../src/services/user/UserServiceBuilder';

jest.mock('../src/config/config', () => ({
    getConfig: () => ({
        jwtLongSecret: 'test_secret',
        jwtAlgorithm: 'HS256',
        jwtIssuer: 'my-service',
        jwtAudience: 'my-clients',
    }),
}));

jest.mock('../src/services/auth/TokenBlacklistBuilder', () => ({
    __esModule: true,
    default: {
        build: jest.fn(),
    },
}));

jest.mock('../src/services/user/UserServiceBuilder', () => ({
    __esModule: true,
    default: {
        build: jest.fn(),
    },
}));

const mockReq = (token?: string, userId = '123') =>
    ({
        body: token ? { token } : {},
        user: { userId },
        params: {
            userId,
        },
    }) as any;

const mockRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = () => jest.fn();

describe('tokenLongVerify (unit)', () => {
    const config = getConfig();

    let blacklistMock: any;
    let userServiceMock: any;

    const validToken = jwt.sign({ purpose: 'refresh' }, config.jwtLongSecret, {
        algorithm: config.jwtAlgorithm as jwt.Algorithm,
        issuer: config.jwtIssuer,
        audience: config.jwtAudience,
        expiresIn: '1h',
        subject: '123',
    });

    beforeEach(() => {
        blacklistMock = { isBlacklisted: jest.fn().mockResolvedValue(false) };
        userServiceMock = { get: jest.fn().mockResolvedValue({ userId: 123 }) };
        (TokenBlacklistBuilder.build as jest.Mock).mockReturnValue(blacklistMock);
        (UserServiceBuilder.build as jest.Mock).mockReturnValue(userServiceMock);
    });

    it('calls next() on valid token', async () => {
        const req = mockReq(validToken);
        const res = mockRes();
        const next = mockNext();

        await tokenLongVerify(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 400 if token is missing', async () => {
        const req = mockReq(undefined);
        const res = mockRes();
        const next = mockNext();

        await tokenLongVerify(req, res, next);

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(res.json).toHaveBeenCalledWith({
            data: {},
            errors: [{ errorCode: ErrorCode.TOKEN_LONG_INVALID_ERROR, payload: undefined }],
            status: ResponseStatusType.INTERNAL,
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 if token length is too short', async () => {
        const req = mockReq('abc');
        const res = mockRes();
        const next = mockNext();

        await tokenLongVerify(req, res, next);

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 if secret is wrong', async () => {
        const badToken = jwt.sign({}, 'wrong_secret', {
            algorithm: 'HS256',
            issuer: config.jwtIssuer,
            audience: config.jwtAudience,
            expiresIn: '1h',
            subject: '123',
        });

        const req = mockReq(badToken);
        const res = mockRes();
        const next = mockNext();

        await tokenLongVerify(req, res, next);

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 if sub does not match userId', async () => {
        const badToken = jwt.sign({}, config.jwtLongSecret, {
            algorithm: 'HS256',
            issuer: config.jwtIssuer,
            audience: config.jwtAudience,
            expiresIn: '1h',
            subject: '999',
        });

        const req = mockReq(badToken, '123');
        const res = mockRes();
        const next = mockNext();

        await tokenLongVerify(req, res, next);

        expect(res.status).toHaveBeenCalledWith(HttpCode.BAD_REQUEST);
        expect(next).not.toHaveBeenCalled();
    });
});
