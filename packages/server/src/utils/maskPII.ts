/**
 * Log-safe rendering of personal data.
 *
 * Logs are shipped off the host, retained, and read by people who have no business seeing a
 * user's address; an email in a log line is also the one identifier that is stable across
 * systems, so it is what makes an otherwise harmless log a personal-data store. `userId` is
 * already in every one of these lines and is enough to follow a request through the system.
 */

/**
 * `volodymyr@example.com` -> `v******r@example.com`.
 *
 * The domain is kept: it is not personal on its own and it is what makes a delivery failure
 * or a provider outage recognisable in the logs. The local part keeps its first and last
 * character so two different addresses at one domain stay distinguishable in a trace.
 */
export function maskEmail(email: string | null | undefined): string {
    if (!email) return '<empty>';
    const at = email.lastIndexOf('@');
    if (at <= 0) return '<invalid>';

    const local = email.slice(0, at);
    const domain = email.slice(at + 1);

    if (local.length <= 2) return `${'*'.repeat(local.length)}@${domain}`;
    return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}
