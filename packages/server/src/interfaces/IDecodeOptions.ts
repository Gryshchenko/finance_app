import { RoleType } from '@tenpercent/shared';

export interface IDecodeOptions extends DelayOptions {
    userId: string;
    roule: RoleType;
}
