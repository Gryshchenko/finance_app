import { IProfile } from 'interfaces/IProfile';
import { ICreateProfile } from 'interfaces/ICreateProfile';
import { IDBTransaction } from 'interfaces/IDatabaseConnection';

export interface IProfileService {
    createProfile(data: ICreateProfile, trx?: IDBTransaction): Promise<IProfile | undefined>;
    getProfile(userId: number): Promise<IProfile | undefined>;
    confirmationUserMail(userId: number): Promise<boolean | undefined>;
}
