import { IError } from '@/interfaces/IError';

import { BaseError } from './BaseError';

export class ValidationError extends BaseError {
    constructor({ message, errorCode }: IError) {
        super({ message, errorCode });
        this.name = this.constructor.name;
    }
}
