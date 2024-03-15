import { IMailService } from 'interfaces/IMailService';
import { ISendMailPayload } from 'interfaces/ISendMailPayload';
import { ISendMailResponse } from 'interfaces/ISendMailResponse';
import { IMailEngine } from 'interfaces/IMailEngine';
import { LoggerBase } from 'src/helper/logger/LoggerBase';

const MailEngineBuilder = require('./MailEngineBuilder');

module.exports = class MailService extends LoggerBase implements IMailService {
    private engine: IMailEngine;
    public constructor() {
        super();
        this.engine = MailEngineBuilder.build();
    }

    async sendMail(config: ISendMailPayload): Promise<ISendMailResponse> {
        this._logger.info('send mail');
        const response = await this.engine.send(config);
        this._logger.info('receive mail response');
        return response;
    }
};
