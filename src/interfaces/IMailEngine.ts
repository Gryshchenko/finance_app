import { ISendMailPayload } from 'interfaces/ISendMailPayload';
import { ISendMailResponse } from 'interfaces/ISendMailResponse';

export interface IMailEngine {
    send(payload: ISendMailPayload): Promise<ISendMailResponse>;
}
