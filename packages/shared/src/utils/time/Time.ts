import { DateTime, Interval } from 'luxon';

export enum TimeDuration {
    Hour = 'hour',
}

export enum DateFormat {
    /** 8/ 6/ 2014, 1:07:04 PM */
    DATE_WITH_TIME_SECONDS = 'F',
    /** 2025-09-27 */
    YYYY_MM_DD = 'yyyy-MM-dd',
    /** 27/09/2025 */
    DD_MM_YYYY_SLASH = 'dd/MM/yyyy',
    /** 2025-09-17 */
    DD_MM_YYYY_DOT = 'dd.MM.yyyy',
    /** 27 September 2025 */
    FULL_DATE = 'dd LLLL yyyy',
    /** 17:14 */
    TIME_ONLY = 'HH:mm',
    /** 27 Sep 17:14 */
    SHORT_WITH_TIME = 'dd LLL HH:mm',
}

class Time {
    public static utc(): DateTime<boolean> {
        return DateTime.utc();
    }
    public static jsDateToUTCISO(date: Date): string {
        return DateTime.fromJSDate(date).toUTC().toISO();
    }
    public static getNowISOLocal(): string {
        return DateTime.now().toISO();
    }
    public static getISODateNowUTC(): string {
        return DateTime.now().toUTC().toISO();
    }

    public static toJSDate(time: string): Date {
        return DateTime.fromISO(time).toJSDate();
    }

    public static toUTCISO(time: string): string {
        return DateTime.fromISO(time, { zone: 'utc' }).toJSDate().toISOString();
    }
    public static fromJSDateUTC(time: Date): string {
        const dt = DateTime.fromJSDate(time, { zone: 'utc' });
        return dt.toUTC().toISO();
    }
    public static fromUTCISO(isoString: string, throwOnInvalid = true): DateTime {
        const dt = DateTime.fromISO(isoString, { zone: 'utc' });

        if (!dt.isValid) {
            if (throwOnInvalid) {
                throw new Error(`Invalid ISO date: ${isoString}, explanation: ${dt.invalidExplanation}`);
            } else {
                return DateTime.invalid('Invalid ISO date');
            }
        }

        return dt;
    }
    public static parseUTC(iso: string): DateTime {
        const dt = DateTime.fromISO(iso, { setZone: true });

        if (!dt.isValid) {
            throw new Error(`Invalid ISO date: ${iso}`);
        }

        if (dt.zoneName !== 'UTC') {
            throw new Error(`Date must be in UTC: ${iso}`);
        }

        return dt;
    }
    public static getDiff({ from = new Date(), to, duration }: { from?: Date; to: Date; duration: TimeDuration }): number {
        const startLuxon = DateTime.fromJSDate(from);
        const endLuxon = DateTime.fromJSDate(to);

        const interval = Interval.fromDateTimes(startLuxon, endLuxon);

        return interval.length(duration);
    }
    public static getSeconds(timestamp?: number): number {
        return timestamp ? timestamp : Math.floor(DateTime.now().toSeconds());
    }

    public static getMilliseconds(timestamp?: number): number {
        return timestamp ? timestamp * 1000 : DateTime.now().toMillis();
    }

    public static getSecondsLeft(isoString: string): number {
        const userZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const target = DateTime.fromISO(isoString, { zone: userZone });
        const now = DateTime.now().setZone(userZone);

        const diff = target.toSeconds() - now.toSeconds();
        return Math.max(0, Math.floor(diff));
    }
    public static secondsToMinutes(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const sec = seconds % 60;

        const secStr = sec < 10 ? `0${sec}` : `${sec}`;

        return `${minutes}:${secStr}`;
    }

    public static formatUTCDate(isoString: string, format: DateFormat): string {
        const dt = DateTime.fromISO(isoString, { zone: 'utc' });
        if (!dt.isValid) {
            throw new Error(`Invalid ISO date: ${dt}, explanation: ${dt.invalidExplanation}`);
        }
        return dt.toFormat(format);
    }

    /**
     * Parse a UTC ISO string and format it in the device's local timezone.
     * Use this for any date/time displayed on the UI.
     */
    public static formatLocalDate(isoString: string, format: DateFormat): string {
        const dt = DateTime.fromISO(isoString, { zone: 'utc' }).toLocal();
        if (!dt.isValid) {
            throw new Error(`Invalid ISO date: ${isoString}, explanation: ${dt.invalidExplanation}`);
        }
        return dt.toFormat(format);
    }

    /**
     * Convert a JS Date chosen by the user (local time) to a UTC ISO string.
     * Use this inside onChange handlers before storing/sending the date.
     */
    public static localDateToUTC(date: Date): string {
        return DateTime.fromJSDate(date).toUTC().toISO();
    }

    /**
     * Convert a UTC ISO string to a JS Date in local time.
     * Use this to seed date pickers so they display the correct local time.
     */
    public static utcToLocalDate(isoString: string): Date {
        return DateTime.fromISO(isoString, { zone: 'utc' }).toLocal().toJSDate();
    }
    private static parseISO(dateISO: string): DateTime {
        const dt = DateTime.fromISO(dateISO, { zone: 'utc' });
        if (!dt.isValid) {
            throw new Error(`Invalid ISO date: ${dateISO}, explanation: ${dt.invalidExplanation}`);
        }
        return dt;
    }
    public static toDayInclusiveStart(dateISO: string): string | null {
        return Time.parseISO(dateISO).startOf('day').toISO();
    }

    public static toDayExclusiveEnd(dateISO: string): string | null {
        return Time.parseISO(dateISO).plus({ days: 1 }).endOf('day').toISO();
    }

    public static toMonthStart(dateISO: string): string | null {
        return Time.parseISO(dateISO).startOf('month').toISO();
    }

    public static toYearStart(dateISO: string): string | null {
        return Time.parseISO(dateISO).startOf('year').toISO();
    }

    public static toMonthEndExclusive(dateISO: string): string | null {
        return Time.parseISO(dateISO).startOf('month').plus({ months: 1 }).toISO();
    }

    public static toPreviousMonthStart(dateISO: string): string | null {
        return Time.parseISO(dateISO).startOf('month').minus({ months: 1 }).toISO();
    }

    public static toPreviousMonthEndExclusive(dateISO: string): string | null {
        return Time.parseISO(dateISO).startOf('month').toISO();
    }

    public static getDaysInMonth(dateISO: string): number {
        const dt = DateTime.fromISO(dateISO);
        return dt.daysInMonth;
    }
    public static getCurrentDayInMonth(dateISO: string): number {
        const dt = DateTime.fromISO(dateISO);
        return dt.day;
    }
}

export { Time, DateTime };
