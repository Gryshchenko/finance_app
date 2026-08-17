import { StatsPeriod } from 'types/StatsPeriod';
import { StatsScope } from 'types/StatsScope';

export interface IGetStatsProperties {
    from: string;
    to: string;
    period: StatsPeriod;
    /** Omitted means the endpoint's historical default - see StatsScope. */
    scope?: StatsScope;
}
