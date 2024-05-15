const request = require('supertest');
const app_test = require('../../../src/app');
const { getUserAuthenticationData } = require('../../../src/services/user/UserService');
const { createJWToken } = require('../../../src/services/auth/AuthUtils');

jest.mock('../../../src/services/user/userService', () => ({
    getUserAuthenticationData: jest.fn(),
}));

jest.mock('../../../src/services/user/userService', () => ({
    getUserAuthenticationData: jest.fn(),
}));

jest.mock('../../../src/services/auth/AuthUtils', () => ({
    createJWToken: jest.fn().mockReturnValue('fake-token'),
}));

jest.mock('pg', () => {
    const mPool = {
        connect: jest.fn().mockResolvedValue({
            query: jest.fn().mockResolvedValue({ rows: ['mocked data'] }),
            release: jest.fn(),
        }),
        end: jest.fn().mockResolvedValue(undefined),
    };
    return { Pool: jest.fn(() => mPool) };
});

jest.mock('redis', () => ({
    createClient: jest.fn().mockReturnValue({
        on: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        connect: () => new Promise((resolve) => null),
    }),
}));

describe('POST /login', () => {
    beforeEach(() => {
        getUserAuthenticationData.mockClear();
        createJWToken.mockClear();
    });

    it('should authenticate user and return 200 with a token', async () => {
        getUserAuthenticationData.mockResolvedValue({
            userId: '123',
            email: 'user@example.com',
            passwordHash: 'hashed-password',
            salt: 'salt',
        });
        const response = await request(app_test).post('/auth/signup').send({ email: 'user@example.com', password: 'password' });

        // console.log(response);
        expect(response.statusCode).toBe(200);
        expect(response.headers['authorization']).toBe('Bearer fake-token');
        expect(getUserAuthenticationData).toHaveBeenCalledWith('user@example.com');
        expect(createJWToken).toHaveBeenCalledWith('123', expect.anything());
    });
});
