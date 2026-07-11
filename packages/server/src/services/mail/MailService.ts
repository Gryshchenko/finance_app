import { ISendMailPayload } from 'interfaces/ISendMailPayload';
import { ISendMailResponse } from 'interfaces/ISendMailResponse';
import { LoggerBase } from 'src/helper/logger/LoggerBase';

import MailProviderBuilder, { IMailProvider } from './MailProviderBuilder';

export interface IMailService {
    sendMail(payload: ISendMailPayload): Promise<ISendMailResponse>;
}

export default class MailService extends LoggerBase implements IMailService {
    private readonly provider: IMailProvider;

    public constructor(provider: IMailProvider = MailProviderBuilder.build()) {
        super();
        this.provider = provider;
    }

    async sendMail(config: ISendMailPayload): Promise<ISendMailResponse> {
        this._logger.info(`Send mail via ${this.provider.constructor.name}`);
        const response = await this.provider.send(config);
        this._logger.info('Receive mail response');
        return response;
    }
}
