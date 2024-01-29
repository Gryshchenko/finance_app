const Logger = require('./Logger');

export abstract class LoggerBase {
    // @ts-ignore
    protected readonly _logger: Logger = Logger.Of(this.constructor.toString().match(/\w+/g)[1]);
}
