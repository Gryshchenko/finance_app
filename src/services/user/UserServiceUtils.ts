import { IUserServer } from 'interfaces/IUserServer';
import { IUser } from 'interfaces/IUser';
import { IUserClient } from 'interfaces/IUserClient';
import { ISuccess } from 'interfaces/ISuccess';
import { IFailure } from 'interfaces/IFailure';
import Success from 'src/utils/success/Success';
import Failure from 'src/utils/failure/Failure';

const argon2 = require('argon2');

const cryptoModule = require('crypto');

export default class UserServiceUtils {
    public static getRandomSalt(): Buffer {
        return cryptoModule.randomBytes(16);
    }

    public static async verifyPassword(dbPassword: string, userPassword: string): Promise<ISuccess<boolean> | IFailure> {
        try {
            const result = await argon2.verify(dbPassword, userPassword);
            return new Success(result);
        } catch (err) {
            return new Failure(String(err));
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
