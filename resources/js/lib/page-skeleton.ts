/** Fine-grained skeleton keys — one shape per distinct page UI. */
export type PageSkeletonKind =
    | 'welcome'
    | 'designs'
    | 'gallery'
    | 'formats'
    | 'seo'
    | 'dashboard'
    | 'events-index'
    | 'events-create'
    | 'events-show'
    | 'guests'
    | 'analytics'
    | 'settings'
    | 'auth'
    | 'site-editor'
    | 'card-editor'
    | 'preview'
    | 'public-site'
    | 'public-card'
    | 'error'
    | 'generic';

export type SkeletonShell = 'fullscreen' | 'app' | 'settings' | 'auth';

/** Which layout chrome stays visible while this skeleton shows. */
export function skeletonShell(kind: PageSkeletonKind): SkeletonShell {
    switch (kind) {
        case 'dashboard':
        case 'events-index':
        case 'events-create':
        case 'events-show':
        case 'guests':
        case 'analytics':
            return 'app';
        case 'settings':
            return 'settings';
        case 'auth':
            return 'auth';
        default:
            return 'fullscreen';
    }
}

function normalize(input: string | null | undefined): string {
    return (input || '').trim().replace(/^\//, '').split('?')[0].replace(/\/$/, '');
}

/**
 * Resolve a destination URL path or Inertia component name to a page skeleton.
 */
export function resolveSkeletonKind(pathOrComponent: string | null | undefined): PageSkeletonKind {
    const value = normalize(pathOrComponent);

    if (!value || value === '/') {
        return 'welcome';
    }

    // Inertia component names (exact)
    if (value === 'welcome') {
        return 'welcome';
    }
    if (value === 'seo/landing') {
        return 'seo';
    }
    if (value === 'dashboard') {
        return 'dashboard';
    }
    if (value === 'weddings/index') {
        return 'events-index';
    }
    if (value === 'weddings/create') {
        return 'events-create';
    }
    if (value === 'weddings/show') {
        return 'events-show';
    }
    if (value === 'weddings/edit') {
        return 'site-editor';
    }
    if (value === 'weddings/preview') {
        return 'preview';
    }
    if (value === 'events/card') {
        return 'card-editor';
    }
    if (value === 'studio/guests') {
        return 'guests';
    }
    if (value === 'studio/analytics') {
        return 'analytics';
    }
    if (value.startsWith('settings/')) {
        return 'settings';
    }
    if (value.startsWith('auth/')) {
        return 'auth';
    }
    if (value === 'public/wedding') {
        return 'public-site';
    }
    if (value === 'public/card') {
        return 'public-card';
    }
    if (value === 'marketing/designs') {
        return 'designs';
    }
    if (value === 'marketing/event-gallery') {
        return 'gallery';
    }
    if (value === 'marketing/wedding-formats') {
        return 'formats';
    }
    if (value === 'errors/show') {
        return 'error';
    }

    // URL paths
    if (value === 'dashboard') {
        return 'dashboard';
    }
    if (value === 'guests') {
        return 'guests';
    }
    if (value === 'analytics') {
        return 'analytics';
    }
    if (value === 'settings' || value.startsWith('settings/')) {
        return 'settings';
    }
    if (
        value === 'login' ||
        value === 'register' ||
        value.startsWith('forgot-password') ||
        value.startsWith('reset-password') ||
        value.startsWith('two-factor') ||
        value.startsWith('confirm-password') ||
        value.startsWith('verify-email') ||
        value.startsWith('auth/')
    ) {
        return 'auth';
    }

    // Designs hub vs formats chooser vs per-occasion gallery
    if (value === 'designs') {
        return 'designs';
    }
    if (value === 'designs/weddings' || value.includes('wedding-formats')) {
        return 'formats';
    }
    if (value.startsWith('designs/')) {
        return 'gallery';
    }

    // SEO landing URLs (SeoPageController::pages keys)
    if (
        value.endsWith('-invitation') ||
        value.endsWith('-website') ||
        value === 'wedding-rsvp' ||
        value === 'wedding-website' ||
        value.includes('wedding-invitation') ||
        value.includes('baby-invitation') ||
        value.includes('birthday-invitation')
    ) {
        return 'seo';
    }

    // Public invite
    if (/^invite\/[^/]+\/card$/.test(value) || /^i\/[^/]+\/card$/.test(value)) {
        return 'public-card';
    }
    if (value.startsWith('invite/') || value.startsWith('i/')) {
        return 'public-site';
    }

    // Studio editors / preview (must beat generic /events/{id})
    if (/^events\/[^/]+\/card(?:\/|$)/.test(value)) {
        return 'card-editor';
    }
    if (/^events\/[^/]+\/preview(?:\/|$)/.test(value)) {
        return 'preview';
    }
    if (/^events\/[^/]+\/edit(?:\/|$)/.test(value)) {
        return 'site-editor';
    }
    // Publish endpoint stays on the editor chrome if an overlay ever shows
    if (/^events\/[^/]+\/publish(?:\/|$)/.test(value)) {
        return 'site-editor';
    }

    if (value === 'events/create') {
        return 'events-create';
    }
    if (value === 'events') {
        return 'events-index';
    }
    if (/^events\/[^/]+$/.test(value) && value !== 'events/create') {
        return 'events-show';
    }

    if (value.startsWith('weddings/')) {
        return 'events-index';
    }

    return 'generic';
}
