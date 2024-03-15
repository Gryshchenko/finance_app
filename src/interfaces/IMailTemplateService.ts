import { ISendMailResponse } from 'interfaces/ISendMailResponse';
import { ISendMailPayload } from 'interfaces/ISendMailPayload';

export interface IMailTemplateService {
    getConfirmMailTemplate(): string;
    getForgetPasswordTemplate(): string;
}
