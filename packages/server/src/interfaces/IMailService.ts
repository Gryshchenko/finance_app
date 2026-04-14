import { ISendMailPayload } from 'interfaces/ISendMailPayload';
import { ISendMailResponse } from 'interfaces/ISendMailResponse';

export interface IMailService {
    sendMail(payload: ISendMailPayload): Promise<ISendMailResponse>;
}
