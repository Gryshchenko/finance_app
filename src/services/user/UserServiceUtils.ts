import { IUserServer } from 'interfaces/IUserServer';
import { IUser } from 'interfaces/IUser';
import { IUserStatus } from 'interfaces/IUserStatus';
import { defineArguments } from 'graphql/type/definition';
import { IUserClient } from 'interfaces/IUserClient';

const CryptoJS = require('crypto-js');
const cryptoModule = require('crypto');

export default class UserServiceUtils {
    public static getRandomSalt(): string {
        return cryptoModule.randomBytes(16).toString('hex');
    }

    public static hashPassword(password: string, salt: string): string {
        const iterations = 310000;
        const keySize = 32;

        const key = CryptoJS.PBKDF2(password, salt, {
            keySize,
            iterations,
            hasher: CryptoJS.algo.SHA256,
        });
        return key.toString(CryptoJS.enc.Hex);
    }

    public static convertServerUserToClientUser(user: IUser): IUserClient {
        return {
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
