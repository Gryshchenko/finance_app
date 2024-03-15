import { ISendMailResponse } from 'interfaces/ISendMailResponse';
import { ISendMailPayload } from 'interfaces/ISendMailPayload';

export interface IMailService {
    sendMail(payload: ISendMailPayload): Promise<ISendMailResponse>;
}
