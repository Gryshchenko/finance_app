import { IUserServer } from 'interfaces/IUserServer';
import { IUser } from 'interfaces/IUser';
import { IUserClient } from 'interfaces/IUserClient';
import { ValidationError } from 'src/utils/errors/ValidationError';
import { ErrorCode } from 'types/ErrorCode';
import Logger from 'helper/logger/Logger';

const argon2 = require('argon2');

const cryptoModule = require('crypto');

const _logger = Logger.Of('UserServiceUtils');

export default class UserServiceUtils {
    public static getRandomSalt(): Buffer {
        return cryptoModule.randomBytes(16);
    }

    public static async verifyPassword(dbPassword: string, userPassword: string): Promise<boolean> {
        try {
            const result = await argon2.verify(dbPassword, userPassword);
            if (!result) {
                throw new ValidationError({ message: 'Password verification failed', errorCode: ErrorCode.AUTH });
            }
            return result;
        } catch (e) {
            _logger.info(`Password verify failed due reason: ${(e as { message: string }).message}`);
            throw e;
        }
    }
    public static async hashPassword(password: string, salt: Buffer): Promise<string | undefined> {
        const response = await argon2.hash(password, {
            type: argon2.argon2d,
            memoryCost: 2 ** 16,
            hashLength: 50,
            salt,
        });
        return response;
    }

    public static convertServerUserToClientUser(user: IUser): IUserClient {
        return {
            userId: user.userId,
            email: user.email,
            status: user.status,
            currency: user.currency,
            profile: user.profile,
            additionalInfo: user.additionalInfo,
        };
    }

    public static formatUserDetails(draftUser: IUserServer): IUser {
        return {
            userId: draftUser.userId,
            email: draftUser.email,
            status: draftUser.status,
            createdAt: draftUser.createdAt,
            updatedAt: draftUser.updatedAt,
            currency: {
                currencyCode: draftUser.currencyCode || undefined,
                currencyName: draftUser.currencyName || undefined,
                symbol: draftUser.symbol || undefined,
            },
            profile: {
                locale: draftUser.locale || undefined,
                mailConfirmed: draftUser.mailConfirmed || undefined,
            },
            additionalInfo: draftUser.additionalInfo,
        };
    }
}
