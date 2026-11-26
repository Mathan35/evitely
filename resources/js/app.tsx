import { createInertiaApp } from '@inertiajs/react';
import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import { capturePwaInstallPrompt } from '@/hooks/use-pwa-install';
import AuthGateLayout from '@/layouts/auth-gate-layout';
import { clearStaleDocumentScrollLocks } from '@/lib/document-scroll-lock';
import { installUiRipple } from '@/lib/ui-ripple';

const appName = import.meta.env.VITE_APP_NAME || 'Invidora';

const AppLayout = lazy(() => import('@/layouts/app-layout'));
const AdminLayout = lazy(() => import('@/layouts/admin-layout'));
const AdminAuthLayout = lazy(() => import('@/layouts/admin-auth-layout'));
const AuthLayout = lazy(() => import('@/layouts/auth-layout'));
const SettingsLayout = lazy(() => import('@/layouts/settings/layout'));

function isAdminPath(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/');
}

function clearBootSkeleton(): void {
    if (typeof document === 'undefined') {
        return;
    }

    document.documentElement.classList.remove('boot-skeleton-active', 'festive-loader-active');
    document.getElementById('app-boot-skeleton')?.remove();
    clearStaleDocumentScrollLocks();
}

function resolveLayout(name: string): ComponentType<{ children: ReactNode }> | ComponentType<{ children: ReactNode }>[] {
    switch (true) {
        case name === 'welcome':
        case name === 'support':
        case name === 'weddings/preview':
        case name === 'weddings/edit':
        case name === 'events/card':
        case name.startsWith('public/'):
        case name.startsWith('seo/'):
        case name.startsWith('legal/'):
        case name.startsWith('marketing/'):
        case name.startsWith('errors/'):
            return AuthGateLayout;
        case name.startsWith('auth/'):
            return [AuthGateLayout, AuthLayout];
        case name === 'admin/login':
            return AdminAuthLayout;
        case name.startsWith('admin/'):
            return AdminLayout;
        case name.startsWith('settings/'):
            return [AuthGateLayout, AppLayout, SettingsLayout];
        default:
            return [AuthGateLayout, AppLayout];
    }
}

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => resolveLayout(name),
    strictMode: true,
    withApp(app) {
        // Keep siblings of `{app}` free of usePage()/Inertia hooks — they sit
        // outside the Inertia provider and crash SSR + client boot (boot skeleton
        // then stays up and eats every click).
        return (
            <Suspense fallback={null}>
                <TooltipProvider delayDuration={0}>
                    {app}
                    <Toaster />
                </TooltipProvider>
            </Suspense>
        );
    },
    progress: isAdminPath()
        ? false
        : {
              color: '#8d6b3e',
          },
}).then(() => {
    clearBootSkeleton();
}).catch(() => {
    clearBootSkeleton();
});

// Failsafe: never leave the fullscreen boot sheet blocking taps forever.
if (typeof window !== 'undefined') {
    window.setTimeout(clearBootSkeleton, 12000);
}

const onAdmin = isAdminPath();

if (! onAdmin) {
    // Studio-only: theme + ripple + PWA. Admin stays lean for fast loads.
    initializeTheme();
    installUiRipple();
    // Captures beforeinstallprompt + registers the service worker immediately.
    capturePwaInstallPrompt();
} else {
    clearBootSkeleton();
}
