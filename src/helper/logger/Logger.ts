import Utils from 'src/utils/Utils';

export enum LogLevel {
    DISABLED,
    ERROR,
    WARNING,
    INFO,
    DEBUG,
}
export const deserialize = (logLevel: string): LogLevel => {
    switch (logLevel) {
        case 'disabled':
            return LogLevel.DISABLED;
        case 'error':
            return LogLevel.ERROR;
        case 'warn':
            return LogLevel.WARNING;
        case 'info':
            return LogLevel.INFO;
        case 'debug':
            return LogLevel.DEBUG;
        default:
            return LogLevel.DISABLED;
    }
};

export default class Logger {
    private static LOG_LEVEL: LogLevel = LogLevel.DEBUG;

    private name: string;

    private constructor(name: string) {
        this.name = name;
    }

    public static Of(name: string): Logger {
        return new Logger(name);
    }

    public static setLogLevel(logLevel: string): void {
        Logger.SetLogLevel(deserialize(logLevel));
    }

    public static SetLogLevel(logLevel: LogLevel): void {
        if (Utils.isNotNull(logLevel)) {
            Logger.LOG_LEVEL = logLevel;
        }
    }

    public debug(message: unknown, ...optionalParams: unknown[]): void {
        if (Logger.LOG_LEVEL >= LogLevel.DEBUG) {
            if (Utils.isArrayNotEmpty(optionalParams)) {
                console.debug(this.format(' D '), message, JSON.stringify(optionalParams));
            } else {
                console.debug(this.format(' D '), message);
            }
        }
    }

    public info(message: unknown, ...optionalParams: unknown[]): void {
        if (Logger.LOG_LEVEL >= LogLevel.INFO) {
            if (Utils.isArrayNotEmpty(optionalParams)) {
                console.warn(this.format(' I '), message, JSON.stringify(optionalParams));
            } else {
                console.info(this.format(' I '), message);
            }
        }
    }

    public warn(message: unknown, ...optionalParams: unknown[]): void {
        if (Logger.LOG_LEVEL >= LogLevel.WARNING) {
            if (Utils.isArrayNotEmpty(optionalParams)) {
                console.warn(this.format(' W '), message, JSON.stringify(optionalParams));
            } else {
                console.warn(this.format(' W '), message);
            }
        }
    }

    public error(message: unknown, ...optionalParams: unknown[]): void {
        if (Logger.LOG_LEVEL >= LogLevel.ERROR) {
            if (Utils.isArrayNotEmpty(optionalParams)) {
                console.error(this.format(' E '), message, JSON.stringify(optionalParams));
            } else {
                console.error(this.format(' E '), message);
            }
        }
    }

    private format(level: string): string {
        return [Logger.formatDate(), level, '[', this.name, ']', ' '].join('');
    }

    private static formatDate(): string {
        const date: Date = new Date();
        return `${[Utils.pad(date.getDate()), Utils.pad(date.getMonth() + 1), date.getFullYear()].join('-')} ${[
            Utils.pad(date.getHours()),
            Utils.pad(date.getMinutes()),
            Utils.pad(date.getSeconds()),
        ].join(':')}.${date.getMilliseconds().toString()}`;
    }
}
