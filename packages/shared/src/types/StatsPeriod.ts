/**
 * Bucket size for a stats time series.
 *
 * The value selects the SQL date truncation used to group transactions, so it must be
 * one the query builder knows - an unrecognised period would silently collapse the
 * series into a single bucket.
 */
export enum StatsPeriod {
    Year = 'year',
    Month = 'month',
    Day = 'day',
}
