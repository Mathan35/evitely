/**
 * Build invite action paths that work on both /invite/{slug}/… and {slug}.domain/…
 */
export function inviteActionPath(
    wedding: { slug: string; invite_root_domain?: string | null },
    suffix: string,
): string {
    const clean = suffix.replace(/^\//, '');
    const root = (wedding.invite_root_domain || '').trim().toLowerCase();

    if (typeof window !== 'undefined' && root) {
        const host = window.location.hostname.toLowerCase();
        if (host !== root && (host === `${wedding.slug}.${root}` || host.endsWith(`.${root}`))) {
            return `/${clean}`;
        }
    }

    return `/invite/${wedding.slug}/${clean}`;
}
