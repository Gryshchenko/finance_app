import { RoleType } from 'types/RoleType';

export interface IDecodeOptions extends DelayOptions {
    userId: string;
    roule: RoleType;
}
