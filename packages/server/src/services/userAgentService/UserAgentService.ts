import { Utils } from 'tenpercent/shared';
import uap from 'ua-parser-js';

import Logger from 'helper/logger/Logger';
import { IUserAgentInfo } from 'interfaces/IUserAgentInfo';

export class UserAgentService {
    public static getUserAgent(userAgent: string | undefined): IUserAgentInfo | undefined {
        const uaParser = new uap.UAParser(userAgent);
        const uaResult = uaParser.getResult();

        return {
            ua: userAgent ?? '',
            browser: {
                name: uaResult.browser.name ?? '',
                major: uaResult.browser.major ?? '',
            },
            cpu: {
                architecture: uaResult.cpu.architecture ?? '',
            },
            device: {
                type: uaResult.device.type ?? '',
            },
            os: {
                name: uaResult.os.name ?? '',
                version: uaResult.os.version ?? '',
            },
        };
    }
    public static compareUserAgent(a: IUserAgentInfo | undefined, b: IUserAgentInfo | undefined): boolean {
        try {
            if (Utils.isNull(a) && Utils.isNull(b)) {
                return true;
            }
            if (Utils.isNull(a) || Utils.isNull(b)) {
                return false;
            }
            const aInWork = a as IUserAgentInfo;
            const bInWork = b as IUserAgentInfo;
            return (
                aInWork.ua === bInWork.ua &&
                aInWork.browser.name === bInWork.browser.name &&
                aInWork.browser.major === bInWork.browser.major &&
                aInWork.cpu.architecture === bInWork.cpu.architecture &&
                aInWork.device.type === bInWork.device.type &&
                aInWork.os.name === bInWork.os.name &&
                aInWork.os.version === bInWork.os.version
            );
        } catch (e: unknown) {
            Logger.Of('UserAgentService').error((e as { message: string }).message);
            return false;
        }
    }
}
