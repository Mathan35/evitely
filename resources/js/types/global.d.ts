import type { Auth } from '@/types/auth';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            galleryFavoriteIds: string[];
            hostAlerts?: {
                total: number;
                rsvps: number;
                wishes: number;
                photos: number;
                items: {
                    id: string;
                    type: string;
                    title: string;
                    detail: string;
                    href: string;
                    at?: string | null;
                }[];
            };
            notifications?: {
                unread: number;
                recent: {
                    id: number;
                    type: string;
                    title: string;
                    body?: string | null;
                    count: number;
                    href?: string | null;
                    actor_name?: string | null;
                    read: boolean;
                    last_occurred_at?: string | null;
                }[];
                cursor?: string | null;
            };
            canResetPassword: boolean;
            canRegister: boolean;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
