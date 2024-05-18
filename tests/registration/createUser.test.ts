// @ts-nocheck

import UserRegistrationServiceBuilder from '../../src/services/registration/UserRegistrationServiceBuilder';
import Success from '../../src/utils/success/Success';
import Failure from '../../src/utils/failure/Failure';
const users = {
    [1]: {
        userId: 1,
        email: 'test@test.com',
        status: 1,
        createdAt: '2',
        updatedAt: '2',
        currency: {
            currencyCode: undefined,
            currencyName: undefined,
            symbol: undefined,
        },
        profile: {
            locale: undefined,
            mailConfirmed: undefined,
        },
        additionalInfo: undefined,
    },
};

const codes = {
    [1]: {
        confirmationId: 1,
        userId: 1,
        email: 'test@test.com',
        confirmationCode: 22222222,
        confirmed: false,
        expiresAt: '10',
    },
};

jest.mock('../../src/services/emailConfirmation/EmailConfirmationDataAccess', () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(() => {
            return {
                deleteUserConfirmation: () => null,
                getUserConfirmationWithEmail: () => null,
                getUserConfirmationWithCode: (userId, code) => codes[userId],
                createUserConfirmation: () => null,
            };
        }),
    };
});

jest.mock('../../src/services/profile/ProfileDataAccess', () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(() => {
            return {
                confirmationUserMail: () => true,
            };
        }),
    };
});

jest.mock('../../src/services/user/UserDataAccess', () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(() => {
            return {
                updateUserEmail: (id: number) => () => users[id],
                getUserEmail: () => ({ email: 'test@test.com' }),
                createUser: () => null,
                getUser: (id: number) => users[id],
                getUserAuthenticationData: () => null,
                fetchUserDetails: () => null,
            };
        }),
    };
});

jest.mock('../../src/repositories/DatabaseConnection', () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(() => {
            return {
                engine: jest.fn().mockReturnValue(() => ({
                    first: jest.fn().mockReturnThis(),
                    where: jest.fn().mockReturnThis(),
                    select: jest.fn().mockReturnThis(),
                    insert: jest.fn().mockReturnThis(),
                    update: jest.fn().mockReturnThis(),
                    delete: jest.fn().mockReturnThis(),
                })),
                close: jest.fn().mockResolvedValue(undefined),
            };
        }),
    };
});

describe('UserRegistrationServiceBuilder', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('confirmUserMail: should confirm user email successfully', async () => {
        const response = await UserRegistrationServiceBuilder.build().confirmUserMail(1, 22222222);
        expect(response).toEqual(new Success(users[1]));
    });
    it('confirmUserMail: wrong CODE should confirm user email failed', async () => {
        const response = await UserRegistrationServiceBuilder.build().confirmUserMail(1, 22222244);
        expect(response).toEqual(new Failure('Confirmation code not same', 4006));
    });
    it('confirmUserMail: wrong user ID should confirm user email failed', async () => {
        const response = await UserRegistrationServiceBuilder.build().confirmUserMail(2, 22222244);
        expect(response).toEqual(new Failure('Confirmation code not same', 4006));
    });
    it("confirmUserMail: all property's null should confirm user email failed", async () => {
        const response = await UserRegistrationServiceBuilder.build().confirmUserMail(null, null);
        expect(response).toEqual(new Failure('Confirmation code not same', 4006));
    });
});
