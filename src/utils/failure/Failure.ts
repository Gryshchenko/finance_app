import { IFailure } from 'interfaces/IFailure';

export default class Failure implements IFailure {
    constructor(
        public error: string,
        public code?: number,
        public isHandled?: boolean,
    ) {}
}
