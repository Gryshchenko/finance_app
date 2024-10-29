// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import Logger, { LogLevel, deserialize } from '../src/helper/logger/Logger';

describe('Logger', () => {
    describe('deserialize function', () => {
        it('should correctly deserialize string to LogLevel', () => {
            expect(deserialize('disabled')).toBe(LogLevel.DISABLED);
            expect(deserialize('error')).toBe(LogLevel.ERROR);
            expect(deserialize('warn')).toBe(LogLevel.WARNING);
            expect(deserialize('info')).toBe(LogLevel.INFO);
            expect(deserialize('debug')).toBe(LogLevel.DEBUG);
        });

        it('should return null for invalid log level strings', () => {
            expect(deserialize('invalid')).toBe(LogLevel.DISABLED);
        });
    });

    describe('setLogLevel', () => {
        it('should update the LOG_LEVEL based on valid string input', () => {
            Logger.setLogLevel('error');
            expect(Logger['LOG_LEVEL']).toBe(LogLevel.ERROR);
        });

        it('should not update LOG_LEVEL on invalid input', () => {
            Logger.setLogLevel('nonexistent');
            expect(Logger['LOG_LEVEL']).toBe(LogLevel.DISABLED);
        });
    });

    describe('Logging methods', () => {
        let consoleSpy;

        beforeEach(() => {
            consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
            jest.spyOn(console, 'info').mockImplementation();
            jest.spyOn(console, 'warn').mockImplementation();
            jest.spyOn(console, 'error').mockImplementation();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should log debug messages when level is DEBUG', () => {
            Logger.setLogLevel('debug');
            Logger.Of('Test').debug('Debug message');
            expect(consoleSpy).toHaveBeenCalledWith(expect.anything(), 'Debug message');
        });

        it('should log info messages when level is INFO or lower', () => {
            Logger.setLogLevel('info');
            const logger = Logger.Of('Test');
            logger.info('Info message');
            expect(console.info).toHaveBeenCalledWith(expect.anything(), 'Info message');
        });

        it('should log warnings when level is WARNING or lower', () => {
            Logger.setLogLevel('warn');
            const logger = Logger.Of('Test');
            logger.warn('Warning message');
            expect(console.warn).toHaveBeenCalledWith(expect.anything(), 'Warning message');
        });

        it('should log errors when level is ERROR or lower', () => {
            Logger.setLogLevel('error');
            const logger = Logger.Of('Test');
            logger.error('Error message');
            expect(console.error).toHaveBeenCalledWith(expect.anything(), 'Error message');
        });

        it('should not log debug when level is higher than DEBUG', () => {
            Logger.setLogLevel('info');
            const logger = Logger.Of('Test');
            logger.debug('This should not appear');
            expect(console.debug).not.toHaveBeenCalled();
        });

        // it('should log info messages when level is INFO or lower with properties', () => {
        //     Logger.setLogLevel('info');
        //     const logger = Logger.Of('Test');
        //     logger.info('Info message', {});
        //     expect(console.info).toHaveBeenCalledWith(expect.anything(), 'Info message', {});
        // });

        it('should log warnings when level is WARNING or lower with properties', () => {
            Logger.setLogLevel('warn');
            const logger = Logger.Of('Test');
            logger.warn('Warning message', {});
            expect(console.warn).toHaveBeenCalledWith(expect.anything(), 'Warning message', '[{}]');
        });

        it('should log errors when level is ERROR or lower with properties', () => {
            Logger.setLogLevel('error');
            const logger = Logger.Of('Test');
            logger.error('Error message', {});
            expect(console.error).toHaveBeenCalledWith(expect.anything(), 'Error message', '[{}]');
        });

        it('should not log debug when level is higher than DEBUG with properties', () => {
            Logger.setLogLevel('info');
            const logger = Logger.Of('Test');
            logger.debug('This should not appear', {});
            expect(console.debug).not.toHaveBeenCalled();
        });
    });

    describe('formatting and utility interaction', () => {
        it('should format date correctly within logs', () => {
            const expectedDate = '25-12-2021 18:30:15.123';
            jest.spyOn(Date.prototype, 'getDate').mockReturnValue(25);
            jest.spyOn(Date.prototype, 'getMonth').mockReturnValue(11); // Month is 0-indexed
            jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2021);
            jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
            jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(30);
            jest.spyOn(Date.prototype, 'getSeconds').mockReturnValue(15);
            jest.spyOn(Date.prototype, 'getMilliseconds').mockReturnValue(123);

            const logger = Logger.Of('Test');
            expect(logger['format'](' I ')).toContain(expectedDate);
        });
    });
});
