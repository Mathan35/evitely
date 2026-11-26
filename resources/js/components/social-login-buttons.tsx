import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Provider = 'google' | 'facebook';

const PROVIDERS: Array<{
    id: Provider;
    label: string;
    icon: ReactNode;
}> = [
    {
        id: 'google',
        label: 'Google',
        icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <path
                    fill="#EA4335"
                    d="M12 10.2v3.6h5.1c-.2 1.2-1.4 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.6 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12S6.9 21.2 12 21.2c5.3 0 8.8-3.7 8.8-8.9 0-.6 0-1-.1-1.5H12Z"
                />
            </svg>
        ),
    },
    {
        id: 'facebook',
        label: 'Facebook',
        icon: (
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <path
                    fill="#1877F2"
                    d="M14.2 20.5v-6.3h2.1l.3-2.4h-2.4V10.2c0-.7.2-1.2 1.2-1.2h1.3V6.9c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.1-3.2 3.3v1.8H9.2v2.4h2.4v6.2h2.6Z"
                />
            </svg>
        ),
    },
];

function redirectUrl(provider: Provider): string {
    const params = new URLSearchParams();
    const path = `${window.location.pathname}${window.location.search}`;
    if (path && path !== '/login' && path !== '/register') {
        params.set('redirect', path.startsWith('/') ? path : `/${path}`);
    }

    const qs = params.toString();
    return `/auth/${provider}/redirect${qs ? `?${qs}` : ''}`;
}

export function SocialLoginButtons({
    className,
    compact = false,
}: {
    className?: string;
    compact?: boolean;
}) {
    const { socialProviders } = usePage<{ socialProviders?: string[] }>().props;
    const enabled = new Set(socialProviders ?? []);
    const providers = PROVIDERS;

    return (
        <div className={cn(compact ? 'pt-2 pb-1' : 'pt-2', className)}>
            <p className="relative text-center text-[12px] text-[#b0a89e]">
                <span className="absolute inset-x-0 top-1/2 border-t border-[#eee7dc]" />
                <span className="relative bg-white px-3">or continue with</span>
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
                {providers.map((provider) => {
                    const isEnabled = enabled.size === 0 || enabled.has(provider.id);

                    return (
                        <a
                            key={provider.id}
                            href={redirectUrl(provider.id)}
                            className={cn(
                                'inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-[#eadfd0] bg-white text-[12px] text-[#2b241c] transition hover:border-[#c6a36a]/50 hover:bg-[#fbf8f3]',
                                !isEnabled && 'opacity-70',
                            )}
                            aria-label={`Continue with ${provider.label}`}
                        >
                            {provider.icon}
                            <span>{provider.label}</span>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
