import { IUserClient } from '@tenpercent/shared';
import argon2 from 'argon2';
import cryptoModule from 'crypto';

import Logger from 'helper/logger/Logger';
import { IUser } from 'interfaces/IUser';
import { IUserServer } from 'interfaces/IUserServer';

const _logger = Logger.Of('UserServiceUtils');

export default class UserServiceUtils {
    public static getRandomSalt(): Buffer {
        return cryptoModule.randomBytes(16);
    }

    public static async verifyPassword(dbPassword: string, userPassword: string): Promise<boolean> {
        try {
            return await argon2.verify(dbPassword, userPassword);
        } catch (e) {
            _logger.error(`Password verify failed due reason: ${(e as { message: string }).message}`);
            return false;
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

    public static convertServerUserToClientUser(user: IUser, tokenLong: string | null, token: string): IUserClient {
        return {
            userId: user.userId,
            email: user.email,
            status: user.status,
            token,
            tokenLong,
        };
    }

    public static formatUserDetails(draftUser: IUserServer): IUser {
        return {
            userId: draftUser.userId,
            email: draftUser.email,
            status: draftUser.status,
        };
    }
}
