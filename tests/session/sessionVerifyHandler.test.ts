import { sessionVerifyHandler } from '../../src/middleware/sessionVerify';
import SessionService from '../../src/services/session/SessionService';
import { UserAgentService } from '../../src/services/userAgentService/UserAgentService';
import { Request, Response } from 'express';

jest.mock('../../src/services/session/SessionService');
jest.mock('../../src/services/userAgentService/UserAgentService');

describe('sessionVerifyHandler', () => {
    let req: Request;
    let res: Response;
    let next: jest.Mock;
    let errorHandler: jest.Mock;

    beforeEach(() => {
        req = {
            headers: {
                'user-agent': 'test-agent',
            },
        } as Request;

        res = {} as Response;
        next = jest.fn();
        errorHandler = jest.fn();
    });

    it('should call errorHandler if session is null', () => {
        (SessionService.extractSessionFromRequest as jest.Mock).mockReturnValue(null);

        sessionVerifyHandler(req, res, next, errorHandler);

        expect(errorHandler).toHaveBeenCalledWith('Session verification failed: user session is null');
        expect(next).not.toHaveBeenCalled();
    });

    it('should call errorHandler if IP does not match', () => {
        (SessionService.extractSessionFromRequest as jest.Mock).mockReturnValue({ ip: '127.0.0.1' });
        (SessionService.getUserIP as jest.Mock).mockReturnValue('192.168.0.1');

        sessionVerifyHandler(req, res, next, errorHandler);

        expect(errorHandler).toHaveBeenCalledWith('Session verification failed: IP address does not match');
        expect(next).not.toHaveBeenCalled();
    });

    it('should call errorHandler if User-Agent does not match', () => {
        (SessionService.extractSessionFromRequest as jest.Mock).mockReturnValue({ userAgent: 'test-agent', ip: '127.0.0.1' });

        (UserAgentService.getUserAgent as jest.Mock).mockReturnValue('different-agent');
        (SessionService.getUserIP as jest.Mock).mockReturnValue('127.0.0.1');

        sessionVerifyHandler(req, res, next, errorHandler);

        expect(errorHandler).toHaveBeenCalledWith('Session verification failed: user agent does not match');
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next if session is valid', () => {
        (SessionService.extractSessionFromRequest as jest.Mock).mockReturnValue({ userAgent: null, ip: '127.0.0.1' });
        (UserAgentService.getUserAgent as jest.Mock).mockReturnValue(null);
        (SessionService.getUserIP as jest.Mock).mockReturnValue('127.0.0.1');
        (UserAgentService.compareUserAgent as jest.Mock).mockReturnValue(true);

        sessionVerifyHandler(req, res, next, errorHandler);

        expect(errorHandler).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });
});
