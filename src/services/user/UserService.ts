import { IUserDataAccess } from 'interfaces/IUserDataAccess';
import { IUser } from 'interfaces/IUser';

const CryptoJS = require('crypto-js');
const crypto = require('crypto');

module.exports = class UserService {
    private _userDataAccess: IUserDataAccess;
    public constructor(userDataAccess: IUserDataAccess) {
        this._userDataAccess = userDataAccess;
    }
    public async getUserByEmail(email: string): Promise<Partial<IUser>> {
        return await this._userDataAccess.getUserByEmail(email);
    }
    public async createUser(email: string, password: string): Promise<IUser> {
        const salt = crypto.randomBytes(16).toString('hex');
        const iterations = 310000;
        const keySize = 32;

        const saltWordArray = CryptoJS.enc.Utf8.parse(salt);

        const key = CryptoJS.PBKDF2(password, saltWordArray, {
            keySize: keySize,
            iterations: iterations,
            hasher: CryptoJS.algo.SHA256,
        });
        const hashedPassword = key.toString(CryptoJS.enc.Hex);
        return await this._userDataAccess.createUser(email, hashedPassword, salt);
    }
    public async updateUser(id: string): Promise<boolean> {
        return new Promise((resolve) => true);
    }
    public async deleteUser(id: string): Promise<boolean> {
        return new Promise((resolve) => true);
    }
};
