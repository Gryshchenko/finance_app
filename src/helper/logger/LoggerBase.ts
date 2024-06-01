import Logger from './Logger';

export abstract class LoggerBase {
    protected readonly _logger: Logger;

    protected constructor() {
        const className = this.constructor.toString().match(/\w+/g)?.[1] ?? 'DefaultClassName';
        this._logger = Logger.Of(className);
    }
}
