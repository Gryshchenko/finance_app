import { baseLogger } from 'helper/logger/pino';

export interface LogContext {
    requestId?: string;
    userId?: string;
    [key: string]: unknown;
}

export default class Logger {
    private readonly _context: Record<string, unknown>;
    private readonly _module: string;

    constructor(moduleName: string, context?: LogContext) {
        this._module = moduleName;
        this._context = context || {};
    }

    static Of(moduleName: string, context?: LogContext) {
        return new Logger(moduleName, context);
    }

    private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: unknown) {
        let extra: Record<string, unknown> = {};
        if (data !== null && data !== undefined) {
            if (typeof data === 'object' && typeof (data as Record<string, unknown>).toJSON === 'function') {
                extra = (data as { toJSON: () => Record<string, unknown> }).toJSON();
            } else if (typeof data === 'object') {
                extra = { ...(data as Record<string, unknown>) };
            } else {
                extra = { data };
            }
        }
        baseLogger[level](
            {
                module: this._module,
                ...this._context,
                ...extra,
            },
            message,
        );
    }

    info(message: string, data?: unknown) {
        this.log('info', message, data);
    }

    warn(message: string, data?: unknown) {
        this.log('warn', message, data);
    }

    error(message: string, data?: unknown) {
        this.log('error', message, data);
    }

    debug(message: string, data?: unknown) {
        this.log('debug', message, data);
    }
}
