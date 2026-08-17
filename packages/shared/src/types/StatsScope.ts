/**
 * Which slice of the data a stats/balance request is about.
 *
 * The scope only ever narrows what the caller may already see: the server derives
 * the underlying item ids from the authenticated user, never from the request.
 *
 * `Own` and `Shared` overlap - an item the user owns and shared into a group is in
 * both - so they do not partition `All`.
 */
export enum StatsScope {
    /** Only items the user owns. */
    Own = 'own',
    /** Only items shared into a group the user belongs to (theirs and other members'). */
    Shared = 'shared',
    /** Everything the user can see: own items plus shared ones. */
    All = 'all',
}
