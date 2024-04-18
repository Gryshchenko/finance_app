const CryptoJS = require('crypto-js');
const cryptoModule = require('crypto');

export default class UserService {
    public static getRandomSalt(): string {
        return cryptoModule.randomBytes(16).toString('hex');
    }
    public static hashPassword(password: string, salt: string): string {
        const iterations = 310000;
        const keySize = 32;

        const key = CryptoJS.PBKDF2(password, salt, {
            keySize: keySize,
            iterations: iterations,
            hasher: CryptoJS.algo.SHA256,
        });
        return key.toString(CryptoJS.enc.Hex);
    }
}
