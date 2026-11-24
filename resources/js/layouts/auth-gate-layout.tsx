import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { AuthGateProvider } from '@/components/auth-gate';
import { PageLoadingFrame } from '@/components/page-loading-frame';
import { PageSkeleton } from '@/components/page-skeletons';
import {
    InertiaNavigatingProvider,
    resolveSkeletonKind,
    skeletonShell,
    useInertiaNavigating,
} from '@/hooks/use-inertia-navigating';
import type { PageSkeletonKind } from '@/lib/page-skeleton';

/**
 * Fullscreen skeletons for marketing / public / editors.
 * App / settings / auth keep chrome and let nested layouts render page-specific bodies.
 */
function AuthGateLoadingShell({ children }: { children: ReactNode }) {
    const { kind } = useInertiaNavigating();
    const page = usePage();
    const currentShell = skeletonShell(resolveSkeletonKind(page.component || page.url));
    const nextShell = skeletonShell(kind);

    // Dev QA: ?skeleton=1 uses this page's kind; ?skeleton=dashboard forces a kind.
    if (import.meta.env.DEV && typeof window !== 'undefined') {
        const preview = new URLSearchParams(window.location.search).get('skeleton');
        if (preview && preview !== '0') {
            const previewKind =
                preview === '1'
                    ? resolveSkeletonKind(page.component || page.url)
                    : (preview as PageSkeletonKind);
            return <PageSkeleton kind={previewKind} path={page.url} />;
        }
    }

    // Same chrome family → nested layout owns the content skeleton.
    const nestedHandles =
        (nextShell === 'app' && currentShell === 'app') ||
        (nextShell === 'settings' && (currentShell === 'settings' || currentShell === 'app')) ||
        (nextShell === 'auth' && currentShell === 'auth');

    if (nestedHandles) {
        return <>{children}</>;
    }

    return (
        <PageLoadingFrame kind={kind} fullscreen className="min-h-svh">
            {children}
        </PageLoadingFrame>
    );
}

export default function AuthGateLayout({ children }: { children: ReactNode }) {
    return (
        <InertiaNavigatingProvider>
            <AuthGateProvider>
                <AuthGateLoadingShell>{children}</AuthGateLoadingShell>
            </AuthGateProvider>
        </InertiaNavigatingProvider>
    );
}
