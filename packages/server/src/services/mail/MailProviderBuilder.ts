import { ISendMailPayload } from 'interfaces/ISendMailPayload';
import { ISendMailResponse } from 'interfaces/ISendMailResponse';
import { getConfig } from 'src/config/config';

import AwsSesProvider from './providers/AwsSesProvider';

export enum MailProviderType {
    AWS = 'aws',
}

export interface IMailProvider {
    send(payload: ISendMailPayload): Promise<ISendMailResponse>;
}

export default class MailProviderBuilder {
    public static build(): IMailProvider {
        const { mailProvider, awsRegion, awsAccessKeyId, awsSecretAccessKey } = getConfig();

        switch (mailProvider) {
            case MailProviderType.AWS:
            default:
                return new AwsSesProvider({
                    region: awsRegion,
                    accessKeyId: awsAccessKeyId,
                    secretAccessKey: awsSecretAccessKey,
                });
        }
    }
}
