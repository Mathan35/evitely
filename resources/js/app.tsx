import { createInertiaApp } from '@inertiajs/react';
import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { CookieConsentBanner } from '@/components/cookie-consent-banner';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AuthGateLayout from '@/layouts/auth-gate-layout';
import { installUiRipple } from '@/lib/ui-ripple';

const appName = import.meta.env.VITE_APP_NAME || 'Evitely';

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

function resolveLayout(name: string): ComponentType<{ children: ReactNode }> | ComponentType<{ children: ReactNode }>[] {
    switch (true) {
        case name === 'welcome':
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
        return (
            <Suspense fallback={null}>
                <TooltipProvider delayDuration={0}>
                    {app}
                    {isAdminPath() ? null : <CookieConsentBanner />}
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
});

const onAdmin = isAdminPath();

if (! onAdmin) {
    // Studio-only: theme + ripple + PWA. Admin stays lean for fast loads.
    initializeTheme();
    installUiRipple();

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            void navigator.serviceWorker.register('/sw.js').catch(() => {
                // Ignore SW registration failures (private mode / unsupported).
            });
        });
    }
} else if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('boot-skeleton-active', 'festive-loader-active');
    document.getElementById('app-boot-skeleton')?.remove();
}
