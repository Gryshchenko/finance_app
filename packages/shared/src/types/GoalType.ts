/**
 * Goals a user can pick during onboarding.
 *
 * The list is a closed set: the ids are stored verbatim against the user and drive
 * which tutorials and dashboard hints are shown, so an unknown id would be dead data
 * that nothing ever reads. It lives here rather than in the sign-up screen because
 * the server has to reject anything outside the set.
 */
export enum GoalType {
    /** Put money aside towards a target. */
    Save = 'save',
    /** Understand where the money goes. */
    Spend = 'spend',
    /** Keep to a planned budget per category. */
    Budget = 'budget',
    /** Track finances together with someone else. */
    Together = 'together',
    /** Grow savings and investments. */
    Grow = 'grow',
}

export const VALID_GOAL_IDS: string[] = Object.values(GoalType);
