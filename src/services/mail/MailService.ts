import { IMailService } from 'interfaces/IMailService';
import { ISendMailPayload } from 'interfaces/ISendMailPayload';
import { ISendMailResponse } from 'interfaces/ISendMailResponse';
import { IMailEngine } from 'interfaces/IMailEngine';
import { LoggerBase } from 'src/helper/logger/LoggerBase';

import MailEngineBuilder from './MailEngineBuilder';

export default class MailService extends LoggerBase implements IMailService {
    private engine: IMailEngine;

    public constructor() {
        super();
        this.engine = MailEngineBuilder.build();
    }

    async sendMail(config: ISendMailPayload): Promise<ISendMailResponse> {
        this._logger.info('Send mail');
        const response = await this.engine.send(config);
        this._logger.info('Receive mail response');
        return response;
    }
}
