export interface IUserAgentInfo {
    ua: string;
    browser: {
        name: string;
        major: string;
    };
    cpu: {
        architecture: string;
    };
    device: {
        type: string;
    };
    os: {
        name: string;
        version: string;
    };
}
