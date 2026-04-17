import { IProfile } from 'interfaces/IProfile';

export interface IProfileWithEmail extends IProfile {
    email: string;
}
