/**
 * Lifecycle state of an account, income or category.
 *
 * `Enable` is the state every entity is created in; the API only ever accepts a
 * transition to `Disable` or `Delete`, which is why patch rules constrain `status` to
 * 2..3 rather than the full range.
 */
export enum AccountStatusType {
    Enable = 1,
    Disable = 2,
    Delete = 3,
}
