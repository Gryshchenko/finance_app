import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Backstop for structured log data. Call sites are expected to pass `maskEmail(...)` rather
 * than a raw address, but error objects and query payloads get spread into the log record
 * wholesale (`Logger.log`), so anything named like a secret or an address is scrubbed here
 * regardless of who put it there. Redaction only reaches object keys - a value interpolated
 * into the message string is invisible to it, which is why the call sites matter too.
 */
const REDACTED_PATHS = [
    'email',
    '*.email',
    'password',
    '*.password',
    'passwordHash',
    '*.passwordHash',
    'salt',
    '*.salt',
    'token',
    '*.token',
    'tokenLong',
    '*.tokenLong',
    'longToken',
    '*.longToken',
    'authorization',
    'confirmationCode',
    '*.confirmationCode',
];

export const baseLogger = pino({
    level: process.env.LOG_LEVEL || 'info',
    redact: { paths: REDACTED_PATHS, censor: '[redacted]' },
    transport: isDev
        ? {
              target: 'pino-pretty',
              options: {
                  colorize: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
              },
          }
        : undefined,
});
